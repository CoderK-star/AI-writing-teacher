import { evalDataset } from '@/lib/eval/dataset';
import { scoreReply } from '@/lib/eval/scorer';
import { generateTeacherReply } from '@/lib/agent/teacher-agent';
import type { EvalResult, EvalSuiteResult, RubricDimension } from '@/lib/types';

const RUBRIC_DIMENSIONS: RubricDimension[] = [
  'clarity',
  'actionability',
  'beginnerFit',
  'grounding',
  'copyrightSafety',
];

/**
 * 全評価ケースを順次実行して集計結果を返す。
 * 各ケースは「応答生成 → LLM ジャッジ採点」の2段階で処理する。
 */
export async function runEvalSuite(options?: {
  /** 特定ケースのみ実行する場合は ID を指定 */
  caseIds?: string[];
  /** 進捗ログを出力するか（デフォルト: true） */
  verbose?: boolean;
}): Promise<EvalSuiteResult> {
  const { caseIds, verbose = true } = options ?? {};

  const targetCases = caseIds ? evalDataset.filter((c) => caseIds.includes(c.id)) : evalDataset;

  if (verbose) {
    console.log(`評価対象: ${targetCases.length} ケース`);
  }

  const results: EvalResult[] = [];

  for (const evalCase of targetCases) {
    if (verbose) {
      process.stdout.write(`  [${evalCase.id}] ${evalCase.name} ... `);
    }

    try {
      // Step 1: エージェントに応答を生成させる
      const agentReply = await generateTeacherReply(evalCase.input);

      // Step 2: LLM ジャッジで採点
      const result = await scoreReply(evalCase, agentReply.answer);
      results.push(result);

      if (verbose) {
        const avg = RUBRIC_DIMENSIONS.reduce((s, d) => s + result.scores[d], 0) / RUBRIC_DIMENSIONS.length;
        console.log(`${result.pass ? '✅' : '❌'} avg=${avg.toFixed(2)}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`\n  ⚠️  [${evalCase.id}] エラー: ${message}`);
    }

    // レート制限対策: 0.5秒待機
    await sleep(500);
  }

  return aggregateResults(results);
}

function aggregateResults(results: EvalResult[]): EvalSuiteResult {
  const averageScores = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((dim) => {
      const avg = results.length > 0 ? results.reduce((s, r) => s + r.scores[dim], 0) / results.length : 0;
      return [dim, Math.round(avg * 100) / 100];
    }),
  ) as Record<RubricDimension, number>;

  const overallAverage =
    results.length > 0
      ? RUBRIC_DIMENSIONS.reduce((s, dim) => s + averageScores[dim], 0) / RUBRIC_DIMENSIONS.length
      : 0;

  return {
    results,
    averageScores,
    overallAverage: Math.round(overallAverage * 100) / 100,
    passCount: results.filter((r) => r.pass).length,
    totalCount: results.length,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
