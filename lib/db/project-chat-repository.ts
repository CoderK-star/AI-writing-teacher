import { eq, desc, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { projectChatSessions } from '@/lib/db/schema';
import type { ChatMessage, GroundedReply, ProjectChatSession, TeachingMode } from '@/lib/types';

function rowToSession(row: typeof projectChatSessions.$inferSelect): ProjectChatSession {
  return {
    id: row.id,
    projectId: row.projectId,
    sceneId: row.sceneId,
    title: row.title,
    mode: row.mode as TeachingMode,
    messages: JSON.parse(row.messages) as ChatMessage[],
    latestResult: row.latestResult ? (JSON.parse(row.latestResult) as GroundedReply) : null,
    updatedAt: row.updatedAt,
  };
}

export async function listProjectChatSessions(projectId: string): Promise<ProjectChatSession[]> {
  const rows = db
    .select()
    .from(projectChatSessions)
    .where(eq(projectChatSessions.projectId, projectId))
    .orderBy(desc(projectChatSessions.updatedAt))
    .all();
  return rows.map(rowToSession);
}

export async function getProjectChatSession(sessionId: string): Promise<ProjectChatSession | null> {
  const row = db
    .select()
    .from(projectChatSessions)
    .where(eq(projectChatSessions.id, sessionId))
    .get();
  return row ? rowToSession(row) : null;
}

export async function createProjectChatSession(params: {
  id: string;
  projectId: string;
  sceneId?: string;
  title: string;
  mode: TeachingMode;
}): Promise<ProjectChatSession> {
  const now = new Date().toISOString();
  db.insert(projectChatSessions)
    .values({
      id: params.id,
      projectId: params.projectId,
      sceneId: params.sceneId ?? null,
      title: params.title,
      mode: params.mode,
      messages: '[]',
      latestResult: null,
      updatedAt: now,
    })
    .run();
  return rowToSession(
    db
      .select()
      .from(projectChatSessions)
      .where(eq(projectChatSessions.id, params.id))
      .get()!,
  );
}

export async function updateProjectChatSession(params: {
  id: string;
  messages: ChatMessage[];
  latestResult: GroundedReply | null;
}): Promise<void> {
  db.update(projectChatSessions)
    .set({
      messages: JSON.stringify(params.messages),
      latestResult: params.latestResult ? JSON.stringify(params.latestResult) : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(projectChatSessions.id, params.id))
    .run();
}

export async function deleteProjectChatSession(sessionId: string, projectId?: string): Promise<void> {
  const condition = projectId
    ? and(eq(projectChatSessions.id, sessionId), eq(projectChatSessions.projectId, projectId))
    : eq(projectChatSessions.id, sessionId);
  db.delete(projectChatSessions).where(condition).run();
}
