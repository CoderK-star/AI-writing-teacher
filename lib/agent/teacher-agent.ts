import { routeToAgent } from '@/lib/agent/router';
import { buildLearnerProfile } from '@/lib/memory/profile';
import { formatRetrievedContext, retrieveKnowledge } from '@/lib/rag/search';
import { listNotesByTag, listAiNotesByTag } from '@/lib/db/note-repository';
import type { ChatMessage, GroundedReply, TeachingMode } from '@/lib/types';

/**
 * メモをフォーマットしてエージェントに渡すコンテキスト文字列を生成（最刧6件・500字以内）
 */
function buildNotesContext(items: Array<{ title: string; content: string }>): string {
  if (items.length === 0) return '';
  const lines = items
    .slice(0, 6)
    .map((n, i) => `[${i + 1}] ${n.title}\n${n.content.slice(0, 200)}`);
  return lines.join('\n\n').slice(0, 600);
}

/**
 * 教師エージェントのオーケストレーター。
 * RAG 検索 → プロフィール構築 → メモ取得 → モード別エージェント選択 → 応答生成 の流れを調停する。
 * 外部 API（app/api/chat/route.ts）のシグネチャを維持するため、この関数を公開エントリポイントとして保持する。
 */
export async function generateTeacherReply(params: {
  mode: TeachingMode;
  messages: ChatMessage[];
  /** プロジェクト内チャット用（プロジェクトメモを取得） */
  projectId?: string;
  /** スタンドアロンチャット用（ai_notesを取得） */
  userId?: string;
}): Promise<GroundedReply> {
  const { mode, messages, projectId, userId } = params;

  // 共通処理: RAG 検索・プロフィール構築
  const retrieved = await retrieveKnowledge(messages);
  const retrievedContext = formatRetrievedContext(retrieved);
  const profile = buildLearnerProfile(messages);

  // AI学習メモ取得（プロジェクトメモ + スタンドアロンメモをマージ）
  const TAG = 'AI学習';
  const [projectNotes, aiNotesList] = await Promise.all([
    projectId ? listNotesByTag(projectId, TAG) : Promise.resolve([]),
    userId ? listAiNotesByTag(userId, TAG) : Promise.resolve([]),
  ]);
  const allNotes = [...projectNotes, ...aiNotesList];
  const userNotes = allNotes.length > 0 ? buildNotesContext(allNotes) : undefined;

  // モードに対応する専門エージェントを選択して実行
  const agent = routeToAgent(mode);
  const result = await agent.execute({
    mode,
    messages,
    profile,
    retrievedKnowledge: retrieved,
    retrievedContext,
    userNotes,
  });

  return result;
}