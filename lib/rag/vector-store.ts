import { LocalIndex } from 'vectra';

import { appConfig } from '@/lib/agent/config';
import { buildChunkText, createEmbedding, createEmbeddings } from '@/lib/rag/embedding';
import type { KnowledgeChunk } from '@/lib/types';

let indexInstance: LocalIndex | null = null;

function getIndex(): LocalIndex {
  if (!indexInstance) {
    indexInstance = new LocalIndex(appConfig.vectraIndexPath);
  }
  return indexInstance;
}

/**
 * ベクタインデックスが存在しなければ作成する。
 */
export async function ensureIndex(): Promise<void> {
  const index = getIndex();
  const exists = await index.isIndexCreated();
  if (!exists) {
    await index.createIndex({ version: 1, deleteIfExists: false });
  }
}

/**
 * KnowledgeChunk を埋め込み生成してインデックスに upsert する。
 * OPENAI_API_KEY が未設定の場合は何もしない（mock モードではスキップ）。
 */
export async function upsertChunks(chunks: KnowledgeChunk[]): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return;

  await ensureIndex();
  const index = getIndex();

  const texts = chunks.map((chunk) =>
    buildChunkText({ title: chunk.title, topic: chunk.topic, content: chunk.content, tags: chunk.tags }),
  );

  const embeddings = await createEmbeddings(texts);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];
    const chunk = chunks[i];

    if (!embedding || !chunk) continue;

    await index.upsertItem({
      id: chunk.id,
      vector: embedding,
      metadata: {
        id: chunk.id,
        title: chunk.title,
        topic: chunk.topic,
        content: chunk.content,
        tags: chunk.tags.join(','),
      },
    });
  }
}

/**
 * クエリテキストに近い上位 topK チャンクを返す。
 * インデックスが存在しない、または API キーがない場合は空配列を返す。
 */
export async function queryByText(queryText: string, topK: number): Promise<KnowledgeChunk[]> {
  if (!process.env.OPENAI_API_KEY) return [];

  const index = getIndex();
  const exists = await index.isIndexCreated();
  if (!exists) return [];

  const queryVector = await createEmbedding(queryText);
  if (!queryVector) return [];

  const results = await index.queryItems(queryVector, queryText, topK);

  return results.map(({ item }) => {
    const meta = item.metadata as Record<string, unknown>;
    const tagsRaw = typeof meta.tags === 'string' ? meta.tags : '';
    return {
      id: String(meta.id ?? ''),
      title: String(meta.title ?? ''),
      topic: String(meta.topic ?? ''),
      content: String(meta.content ?? ''),
      tags: tagsRaw ? tagsRaw.split(',') : [],
    } satisfies KnowledgeChunk;
  });
}

/**
 * インデックスに登録されているアイテム数を返す。
 */
export async function getIndexedCount(): Promise<number> {
  const index = getIndex();
  const exists = await index.isIndexCreated();
  if (!exists) return 0;
  const stats = await index.getIndexStats();
  return stats.items;
}
