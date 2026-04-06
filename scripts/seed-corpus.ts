/**
 * コーパスをベクタインデックスに登録するシードスクリプト。
 *
 * 使用方法:
 *   npx tsx scripts/seed-corpus.ts
 *
 * OPENAI_API_KEY が必要です。未設定の場合はエラー終了します。
 */

// 環境変数を .env.local から読み込む
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY が設定されていません。.env.local を確認してください。');
  process.exit(1);
}

import { writingCorpus } from '../lib/rag/corpus';
import { ensureIndex, upsertChunks, getIndexedCount } from '../lib/rag/vector-store';

async function main() {
  console.log('=== コーパスシード開始 ===');
  console.log(`対象チャンク数: ${writingCorpus.length}`);

  console.log('インデックスを初期化しています...');
  await ensureIndex();

  console.log('埋め込みを生成してインデックスに登録しています...');
  await upsertChunks(writingCorpus);

  const count = await getIndexedCount();
  console.log(`\n✅ 完了: ${count} チャンクをインデックスに登録しました。`);
  console.log(`インデックス保存先: ${path.join(process.cwd(), '.vectra')}`);
}

main().catch((error) => {
  console.error('シード中にエラーが発生しました:', error);
  process.exit(1);
});
