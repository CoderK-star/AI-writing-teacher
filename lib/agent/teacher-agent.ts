import { routeToAgent } from '@/lib/agent/router';
import { buildLearnerProfile } from '@/lib/memory/profile';
import { formatRetrievedContext, retrieveKnowledge } from '@/lib/rag/search';
import type { ChatMessage, GroundedReply, TeachingMode } from '@/lib/types';

/**
 * 教師エージェントのオーケストレーター。
 * RAG 検索 → プロフィール構築 → モード別エージェント選択 → 応答生成 の流れを調停する。
 * 外部 API（app/api/chat/route.ts）のシグネチャを維持するため、この関数を公開エントリポイントとして保持する。
 */
export async function generateTeacherReply(params: {
  mode: TeachingMode;
  messages: ChatMessage[];
}): Promise<GroundedReply> {
  const { mode, messages } = params;

  // 共通処理: RAG 検索・プロフィール構築
  const retrieved = await retrieveKnowledge(messages);
  const retrievedContext = formatRetrievedContext(retrieved);
  const profile = buildLearnerProfile(messages);

  // モードに対応する専門エージェントを選択して実行
  const agent = routeToAgent(mode);
  const result = await agent.execute({
    mode,
    messages,
    profile,
    retrievedKnowledge: retrieved,
    retrievedContext,
  });

  return result;
}