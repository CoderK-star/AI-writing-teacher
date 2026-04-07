import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { worldSettings } from '@/lib/db/schema';
import type { WorldSetting, WorldCategory } from '@/lib/types';

function rowToWorld(row: typeof worldSettings.$inferSelect): WorldSetting {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    category: row.category as WorldCategory,
    description: row.description,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listWorldSettings(projectId: string): Promise<WorldSetting[]> {
  const rows = db
    .select()
    .from(worldSettings)
    .where(eq(worldSettings.projectId, projectId))
    .orderBy(asc(worldSettings.category), asc(worldSettings.name))
    .all();
  return rows.map(rowToWorld);
}

export async function getWorldSetting(settingId: string): Promise<WorldSetting | null> {
  const row = db.select().from(worldSettings).where(eq(worldSettings.id, settingId)).get();
  return row ? rowToWorld(row) : null;
}

export async function createWorldSetting(params: {
  id: string;
  projectId: string;
  name: string;
  category?: WorldCategory;
  description?: string;
}): Promise<WorldSetting> {
  const now = new Date().toISOString();
  db.insert(worldSettings)
    .values({
      id: params.id,
      projectId: params.projectId,
      name: params.name,
      category: params.category ?? 'other',
      description: params.description ?? '',
      notes: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToWorld(
    db.select().from(worldSettings).where(eq(worldSettings.id, params.id)).get()!,
  );
}

export async function updateWorldSetting(
  settingId: string,
  patch: Partial<Pick<WorldSetting, 'name' | 'category' | 'description' | 'notes'>>,
): Promise<WorldSetting | null> {
  const now = new Date().toISOString();
  db.update(worldSettings).set({ ...patch, updatedAt: now }).where(eq(worldSettings.id, settingId)).run();
  return getWorldSetting(settingId);
}

export async function deleteWorldSetting(settingId: string): Promise<void> {
  db.delete(worldSettings).where(eq(worldSettings.id, settingId)).run();
}
