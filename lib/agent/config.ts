import path from 'path';

export const appConfig = {
  name: 'AI Writing Teacher',
  targetAudience: 'Web小説投稿初心者',
  model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  provider: process.env.OPENAI_API_KEY ? 'openai' : 'mock',
  maxRetrievedChunks: 3,
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
  vectraIndexPath: path.join(process.cwd(), '.vectra'),
} as const;