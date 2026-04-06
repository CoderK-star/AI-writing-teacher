import OpenAI from 'openai';

import { appConfig } from '@/lib/agent/config';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

/**
 * 単一テキストの埋め込みベクタを生成して返す。
 * OPENAI_API_KEY が未設定の場合は null を返す。
 */
export async function createEmbedding(text: string): Promise<number[] | null> {
  const client = getOpenAI();
  if (!client) return null;

  const response = await client.embeddings.create({
    model: appConfig.embeddingModel,
    input: text.replace(/\n/g, ' '),
  });

  return response.data[0]?.embedding ?? null;
}

/**
 * 複数テキストをバッチで埋め込み生成する。
 * OPENAI_API_KEY が未設定の場合は全て null を返す。
 */
export async function createEmbeddings(texts: string[]): Promise<Array<number[] | null>> {
  const client = getOpenAI();
  if (!client) return texts.map(() => null);

  const response = await client.embeddings.create({
    model: appConfig.embeddingModel,
    input: texts.map((text) => text.replace(/\n/g, ' ')),
  });

  return response.data.map((item) => item.embedding ?? null);
}

/**
 * KnowledgeChunk のインデックス用テキストを組み立てる。
 * タイトル・トピック・コンテンツ・タグを結合する。
 */
export function buildChunkText(params: { title: string; topic: string; content: string; tags: string[] }): string {
  return `${params.title} ${params.topic} ${params.content} ${params.tags.join(' ')}`;
}
