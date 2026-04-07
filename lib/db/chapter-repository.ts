import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { chapters, scenes } from '@/lib/db/schema';
import type { Chapter, Scene, ProjectStatus } from '@/lib/types';

function rowToChapter(row: typeof chapters.$inferSelect): Chapter {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    sortOrder: row.sortOrder,
    synopsis: row.synopsis,
    status: row.status as ProjectStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToScene(row: typeof scenes.$inferSelect): Scene {
  return {
    id: row.id,
    chapterId: row.chapterId,
    projectId: row.projectId,
    title: row.title,
    sortOrder: row.sortOrder,
    content: row.content,
    synopsis: row.synopsis,
    povCharacterId: row.povCharacterId,
    wordCount: row.wordCount,
    status: row.status as ProjectStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** プロジェクトの全章をsortOrder順で取得（各章にsceneを含む） */
export async function listChaptersWithScenes(projectId: string): Promise<Chapter[]> {
  const chapterRows = db
    .select()
    .from(chapters)
    .where(eq(chapters.projectId, projectId))
    .orderBy(asc(chapters.sortOrder))
    .all();

  return Promise.all(
    chapterRows.map(async (ch) => {
      const sceneRows = db
        .select()
        .from(scenes)
        .where(eq(scenes.chapterId, ch.id))
        .orderBy(asc(scenes.sortOrder))
        .all();
      return { ...rowToChapter(ch), scenes: sceneRows.map(rowToScene) };
    }),
  );
}

/** 章を作成 */
export async function createChapter(params: {
  id: string;
  projectId: string;
  title: string;
  sortOrder: number;
}): Promise<Chapter> {
  const now = new Date().toISOString();
  db.insert(chapters)
    .values({
      id: params.id,
      projectId: params.projectId,
      title: params.title,
      sortOrder: params.sortOrder,
      synopsis: null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToChapter(
    db.select().from(chapters).where(eq(chapters.id, params.id)).get()!,
  );
}

/** 章を更新 */
export async function updateChapter(
  chapterId: string,
  patch: Partial<Pick<Chapter, 'title' | 'synopsis' | 'status' | 'sortOrder'>>,
): Promise<Chapter | null> {
  const now = new Date().toISOString();
  db.update(chapters).set({ ...patch, updatedAt: now }).where(eq(chapters.id, chapterId)).run();
  const row = db.select().from(chapters).where(eq(chapters.id, chapterId)).get();
  return row ? rowToChapter(row) : null;
}

/** 章を削除 */
export async function deleteChapter(chapterId: string): Promise<void> {
  db.delete(chapters).where(eq(chapters.id, chapterId)).run();
}

/** 章のsortOrderを一括更新（並び替え用） */
export async function reorderChapters(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  const now = new Date().toISOString();
  for (const item of items) {
    db.update(chapters)
      .set({ sortOrder: item.sortOrder, updatedAt: now })
      .where(eq(chapters.id, item.id))
      .run();
  }
}

/** シーンを 1 件取得 */
export async function getScene(sceneId: string): Promise<Scene | null> {
  const row = db.select().from(scenes).where(eq(scenes.id, sceneId)).get();
  return row ? rowToScene(row) : null;
}

/** シーンを作成 */
export async function createScene(params: {
  id: string;
  chapterId: string;
  projectId: string;
  title: string;
  sortOrder: number;
}): Promise<Scene> {
  const now = new Date().toISOString();
  db.insert(scenes)
    .values({
      id: params.id,
      chapterId: params.chapterId,
      projectId: params.projectId,
      title: params.title,
      sortOrder: params.sortOrder,
      content: '{"type":"doc","content":[]}',
      synopsis: null,
      povCharacterId: null,
      wordCount: 0,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToScene(
    db.select().from(scenes).where(eq(scenes.id, params.id)).get()!,
  );
}

/** シーンのメタデータを更新 */
export async function updateScene(
  sceneId: string,
  patch: Partial<Pick<Scene, 'title' | 'synopsis' | 'status' | 'sortOrder' | 'povCharacterId'>>,
): Promise<Scene | null> {
  const now = new Date().toISOString();
  db.update(scenes).set({ ...patch, updatedAt: now }).where(eq(scenes.id, sceneId)).run();
  return getScene(sceneId);
}

/** シーンのコンテンツ（本文）を更新 — 自動保存専用 */
export async function updateSceneContent(
  sceneId: string,
  content: string,
  wordCount: number,
): Promise<void> {
  db.update(scenes)
    .set({ content, wordCount, updatedAt: new Date().toISOString() })
    .where(eq(scenes.id, sceneId))
    .run();
}

/** シーンを削除 */
export async function deleteScene(sceneId: string): Promise<void> {
  db.delete(scenes).where(eq(scenes.id, sceneId)).run();
}

/** シーンのsortOrderを一括更新 */
export async function reorderScenes(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  const now = new Date().toISOString();
  for (const item of items) {
    db.update(scenes)
      .set({ sortOrder: item.sortOrder, updatedAt: now })
      .where(eq(scenes.id, item.id))
      .run();
  }
}
