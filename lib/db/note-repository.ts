import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { notes, aiNotes } from '@/lib/db/schema';
import type { Note, AiNote } from '@/lib/types';

function rowToNote(row: typeof notes.$inferSelect): Note {
  return {
    id: row.id,
    projectId: row.projectId,
    userId: row.userId ?? null,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToAiNote(row: typeof aiNotes.$inferSelect): AiNote {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listNotes(projectId: string): Promise<Note[]> {
  const rows = db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(desc(notes.updatedAt))
    .all();
  return rows.map(rowToNote);
}

export async function getNote(noteId: string): Promise<Note | null> {
  const row = db.select().from(notes).where(eq(notes.id, noteId)).get();
  return row ? rowToNote(row) : null;
}

export async function createNote(params: {
  id: string;
  projectId: string;
  title: string;
  content?: string;
  tags?: string[];
}): Promise<Note> {
  const now = new Date().toISOString();
  db.insert(notes)
    .values({
      id: params.id,
      projectId: params.projectId,
      title: params.title,
      content: params.content ?? '',
      tags: JSON.stringify(params.tags ?? []),
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToNote(db.select().from(notes).where(eq(notes.id, params.id)).get()!);
}

export async function updateNote(
  noteId: string,
  patch: Partial<Pick<Note, 'title' | 'content' | 'tags'>>,
): Promise<Note | null> {
  const now = new Date().toISOString();
  const dbPatch = {
    ...patch,
    tags: patch.tags !== undefined ? JSON.stringify(patch.tags) : undefined,
    updatedAt: now,
  };
  db.update(notes).set(dbPatch).where(eq(notes.id, noteId)).run();
  return getNote(noteId);
}

export async function deleteNote(noteId: string): Promise<void> {
  db.delete(notes).where(eq(notes.id, noteId)).run();
}

/** タグフィルタでプロジェクトメモを取得（最新5件） */
export async function listNotesByTag(projectId: string, tag: string): Promise<Note[]> {
  const rows = db
    .select()
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(desc(notes.updatedAt))
    .all();
  return rows
    .map(rowToNote)
    .filter((n) => n.tags.includes(tag))
    .slice(0, 5);
}

// ─── ai_notes（スタンドアロンチャット用メモ） ─────────────────────────────

export async function listAiNotes(userId: string): Promise<AiNote[]> {
  const rows = db
    .select()
    .from(aiNotes)
    .where(eq(aiNotes.userId, userId))
    .orderBy(desc(aiNotes.updatedAt))
    .all();
  return rows.map(rowToAiNote);
}

export async function listAiNotesByTag(userId: string, tag: string): Promise<AiNote[]> {
  const rows = db
    .select()
    .from(aiNotes)
    .where(eq(aiNotes.userId, userId))
    .orderBy(desc(aiNotes.updatedAt))
    .all();
  return rows
    .map(rowToAiNote)
    .filter((n) => n.tags.includes(tag))
    .slice(0, 5);
}

export async function createAiNote(params: {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags?: string[];
}): Promise<AiNote> {
  const now = new Date().toISOString();
  db.insert(aiNotes)
    .values({
      id: params.id,
      userId: params.userId,
      title: params.title,
      content: params.content,
      tags: JSON.stringify(params.tags ?? []),
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToAiNote(db.select().from(aiNotes).where(eq(aiNotes.id, params.id)).get()!);
}

export async function deleteAiNote(noteId: string): Promise<void> {
  db.delete(aiNotes).where(eq(aiNotes.id, noteId)).run();
}
