import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import type { Project, ProjectStatus } from '@/lib/types';

function rowToProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    genre: row.genre,
    synopsis: row.synopsis,
    targetWordCount: row.targetWordCount,
    status: row.status as ProjectStatus,
    coverColor: row.coverColor,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** ユーザーの全プロジェクトを更新日時の降順で取得 */
export async function listProjects(userId: string): Promise<Project[]> {
  const rows = db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))
    .all();
  return rows.map(rowToProject);
}

/** プロジェクトを 1 件取得 */
export async function getProject(projectId: string): Promise<Project | null> {
  const row = db.select().from(projects).where(eq(projects.id, projectId)).get();
  return row ? rowToProject(row) : null;
}

/** 新しいプロジェクトを作成 */
export async function createProject(params: {
  id: string;
  userId: string;
  title: string;
  genre?: string;
  synopsis?: string;
  targetWordCount?: number;
  coverColor?: string;
}): Promise<Project> {
  const now = new Date().toISOString();
  db.insert(projects)
    .values({
      id: params.id,
      userId: params.userId,
      title: params.title,
      genre: params.genre ?? null,
      synopsis: params.synopsis ?? null,
      targetWordCount: params.targetWordCount ?? null,
      status: 'draft',
      coverColor: params.coverColor ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return rowToProject(
    db.select().from(projects).where(eq(projects.id, params.id)).get()!,
  );
}

/** プロジェクトを更新 */
export async function updateProject(
  projectId: string,
  patch: Partial<Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetWordCount' | 'status' | 'coverColor'>>,
): Promise<Project | null> {
  const now = new Date().toISOString();
  db.update(projects)
    .set({ ...patch, updatedAt: now })
    .where(eq(projects.id, projectId))
    .run();
  return getProject(projectId);
}

/** プロジェクトを削除 */
export async function deleteProject(projectId: string): Promise<void> {
  db.delete(projects).where(eq(projects.id, projectId)).run();
}
