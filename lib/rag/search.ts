import { writingCorpus } from '@/lib/rag/corpus';
import { queryByText } from '@/lib/rag/vector-store';
import { appConfig } from '@/lib/agent/config';
import type { ChatMessage, KnowledgeChunk } from '@/lib/types';

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);

function scoreChunk(chunk: KnowledgeChunk, queryTokens: string[]): number {
  const haystack = tokenize([chunk.title, chunk.topic, chunk.content, chunk.tags.join(' ')].join(' '));
  const tokenSet = new Set(haystack);

  return queryTokens.reduce((score, token) => score + (tokenSet.has(token) ? 2 : 0), 0);
}

/** OPENAI_API_KEY がない場合のフォールバック: トークン一致検索 */
function retrieveByKeyword(messages: ChatMessage[]): KnowledgeChunk[] {
  const query = messages
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => message.content)
    .join(' ');

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return writingCorpus.slice(0, appConfig.maxRetrievedChunks);
  }

  return [...writingCorpus]
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, appConfig.maxRetrievedChunks)
    .map(({ chunk }) => chunk);
}

/**
 * 直近のユーザー発言をもとに関連チャンクを返す。
 * OPENAI_API_KEY がある場合はベクタ検索、ない場合はキーワード検索にフォールバックする。
 */
export async function retrieveKnowledge(messages: ChatMessage[]): Promise<KnowledgeChunk[]> {
  if (!process.env.OPENAI_API_KEY) {
    return retrieveByKeyword(messages);
  }

  const query = messages
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => message.content)
    .join(' ');

  if (!query.trim()) {
    return writingCorpus.slice(0, appConfig.maxRetrievedChunks);
  }

  const vectorResults = await queryByText(query, appConfig.maxRetrievedChunks);

  // ベクタインデックスが空の場合はキーワード検索にフォールバック
  if (vectorResults.length === 0) {
    return retrieveByKeyword(messages);
  }

  return vectorResults;
}

export function formatRetrievedContext(chunks: KnowledgeChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.title} (${chunk.topic})\n${chunk.content}\n関連タグ: ${chunk.tags.join(', ')}`,
    )
    .join('\n\n');
}
