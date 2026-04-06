/**
 * 評価スイートを実行するCLIスクリプト。
 *
 * 使用方法:
 *   npm run eval
 *   npx tsx scripts/run-eval.ts
 *   npx tsx scripts/run-eval.ts --cases tc-01,tc-02
 *
 * OPENAI_API_KEY が必要です。
 */

import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY が設定されていません。');
  process.exit(1);
}

import { runEvalSuite } from '../lib/eval/runner';
import type { EvalSuiteResult, RubricDimension } from '../lib/types';

const RUBRIC_LABELS: Record<RubricDimension, string> = {
  clarity: 'Clarity',
  actionability: 'Actionability',
  beginnerFit: 'BeginnerFit',
  grounding: 'Grounding',
  copyrightSafety: 'CopyrightSafety',
};

async function main() {
  // コマンドライン引数からケースIDを抽出
  const casesArg = process.argv.find((arg) => arg.startsWith('--cases='));
  const caseIds = casesArg ? casesArg.replace('--cases=', '').split(',') : undefined;

  console.log('=== AI Writing Teacher 評価スイート ===\n');

  const suite: EvalSuiteResult = await runEvalSuite({ caseIds, verbose: true });

  // ── 結果テーブル表示 ──
  console.log('\n=== 個別スコア ===');
  console.log('ID      | ケース名                  | Cl | Ac | BF | Gr | CS | Avg  | 判定');
  console.log('--------|--------------------------|----|----|----|----|----|----- |-----');

  for (const result of suite.results) {
    const { scores } = result;
    const avg = Object.values(scores).reduce((s, v) => s + v, 0) / 5;
    const row = [
      result.caseId.padEnd(7),
      result.caseName.slice(0, 24).padEnd(24),
      String(scores.clarity).padStart(2),
      String(scores.actionability).padStart(2),
      String(scores.beginnerFit).padStart(2),
      String(scores.grounding).padStart(2),
      String(scores.copyrightSafety).padStart(2),
      avg.toFixed(2).padStart(5),
      result.pass ? '✅' : '❌',
    ].join(' | ');
    console.log(row);
  }

  console.log('\n=== 観点別平均スコア ===');
  for (const [dim, label] of Object.entries(RUBRIC_LABELS)) {
    const avg = suite.averageScores[dim as RubricDimension];
    console.log(`  ${label.padEnd(16)}: ${avg.toFixed(2)}`);
  }

  console.log(`\n総合平均: ${suite.overallAverage.toFixed(2)} / 4.00`);
  console.log(`合格率:   ${suite.passCount} / ${suite.totalCount} ケース`);

  // ── JSON 結果ファイル保存 ──
  const outDir = path.join(process.cwd(), 'eval-results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(outDir, `eval-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(suite, null, 2), 'utf-8');
  console.log(`\n結果ファイル保存: ${outPath}`);

  // 合格率が50%を下回ったら終了コード1
  if (suite.totalCount > 0 && suite.passCount / suite.totalCount < 0.5) {
    console.error('\n⚠️  合格率が50%を下回りました。');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('評価中にエラーが発生しました:', error);
  process.exit(1);
});
