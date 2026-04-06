import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { sessions, users } from '@/lib/db/schema';
import type { ChatMessage, ChatSession, GroundedReply, TeachingMode } from '@/lib/types';

/** DB の sessions 行を ChatSession 型に変換する */
function rowToSession(row: typeof sessions.$inferSelect): ChatSession {
  return {
    id: row.id,
    title: row.title,
    mode: row.mode as TeachingMode,
    messages: JSON.parse(row.messages) as ChatMessage[],
    latestResult: row.latestResult ? (JSON.parse(row.latestResult) as GroundedReply) : null,
    updatedAt: row.updatedAt,
  };
}

/** ユーザーが存在しなければ作成する */
export async function ensureUser(userId: string): Promise<void> {
  const existing = db.select().from(users).where(eq(users.id, userId)).get();
  if (!existing) {
    db.insert(users).values({ id: userId, createdAt: new Date().toISOString() }).run();
  }
}

/** ユーザーの全セッションを更新日時の降順で取得する */
export async function listSessions(userId: string): Promise<ChatSession[]> {
  const rows = db.select().from(sessions).where(eq(sessions.userId, userId)).all();
  return rows
    .map(rowToSession)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** セッションを 1 件取得する */
export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const row = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  return row ? rowToSession(row) : null;
}

/** 新しいセッションを作成する */
export async function createSession(params: {
  id: string;
  userId: string;
  title: string;
  mode: TeachingMode;
}): Promise<ChatSession> {
  const now = new Date().toISOString();
  db.insert(sessions)
    .values({
      id: params.id,
      userId: params.userId,
      title: params.title,
      mode: params.mode,
      messages: '[]',
      latestResult: null,
      updatedAt: now,
    })
    .run();

  return {
    id: params.id,
    title: params.title,
    mode: params.mode,
    messages: [],
    latestResult: null,
    updatedAt: now,
  };
}

/** セッションのメッセージと最新結果を更新する */
export async function updateSession(params: {
  id: string;
  messages: ChatMessage[];
  latestResult: GroundedReply | null;
}): Promise<void> {
  db.update(sessions)
    .set({
      messages: JSON.stringify(params.messages),
      latestResult: params.latestResult ? JSON.stringify(params.latestResult) : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sessions.id, params.id))
    .run();
}

/** セッションを削除する */
export async function deleteSession(sessionId: string): Promise<void> {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}
