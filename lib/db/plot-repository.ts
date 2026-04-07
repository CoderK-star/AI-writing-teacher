import { eq, asc, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { plotPoints } from '@/lib/db/schema';
import type { PlotPoint, PlotType, PlotScope } from '@/lib/types';

function rowToPlot(row: typeof plotPoints.$inferSelect): PlotPoint {
  return {
    id: row.id,
    projectId: row.projectId,
    chapterId: row.chapterId,
    scope: (row.scope ?? 'global') as PlotScope,
    title: row.title,
    description: row.description,
    sortOrder: row.sortOrder,
    type: row.type as PlotType,
    linkedCharacterIds: JSON.parse(row.linkedCharacterIds) as string[],
    linkedSceneIds: JSON.parse(row.linkedSceneIds) as string[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listPlotPoints(
  projectId: string,
  options?: { scope?: PlotScope; chapterId?: string },
): Promise<PlotPoint[]> {
  const conditions = [eq(plotPoints.projectId, projectId)];
  if (options?.scope) {
    conditions.push(eq(plotPoints.scope, options.scope));
  }
  if (options?.chapterId) {
    conditions.push(eq(plotPoints.chapterId, options.chapterId));
  } else if (options?.scope === 'global') {
    conditions.push(isNull(plotPoints.chapterId));
  }
  const rows = db
    .select()
    .from(plotPoints)
    .where(and(...conditions))
    .orderBy(asc(plotPoints.sortOrder))
    .all();
  return rows.map(rowToPlot);
}

export async function getPlotPoint(plotId: string): Promise<PlotPoint | null> {
  const row = db.select().from(plotPoints).where(eq(plotPoints.id, plotId)).get();
  return row ? rowToPlot(row) : null;
}

export async function createPlotPoint(params: {
  id: string;
  projectId: string;
  title: string;
  type?: PlotType;
  scope?: PlotScope;
  chapterId?: string | null;
  sortOrder: number;
}): Promise<PlotPoint> {
  const now = new Date().toISOString();
  db.insert(plotPoints)
    .values({
      id: params.id,
      projectId: params.projectId,
      chapterId: params.chapterId ?? null,
      scope: params.scope ?? 'global',
      title: params.title,
      description: null,
      sortOrder: params.sortOrder,
      type: params.type ?? 'other',
      linkedCharacterIds: '[]',
      linkedSceneIds: '[]',
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToPlot(
    db.select().from(plotPoints).where(eq(plotPoints.id, params.id)).get()!,
  );
}

export async function updatePlotPoint(
  plotId: string,
  patch: Partial<Pick<PlotPoint, 'title' | 'description' | 'type' | 'sortOrder' | 'linkedCharacterIds' | 'linkedSceneIds'>>,
): Promise<PlotPoint | null> {
  const now = new Date().toISOString();
  const dbPatch = {
    ...patch,
    linkedCharacterIds:
      patch.linkedCharacterIds !== undefined
        ? JSON.stringify(patch.linkedCharacterIds)
        : undefined,
    linkedSceneIds:
      patch.linkedSceneIds !== undefined ? JSON.stringify(patch.linkedSceneIds) : undefined,
    updatedAt: now,
  };
  db.update(plotPoints).set(dbPatch).where(eq(plotPoints.id, plotId)).run();
  return getPlotPoint(plotId);
}

export async function deletePlotPoint(plotId: string): Promise<void> {
  db.delete(plotPoints).where(eq(plotPoints.id, plotId)).run();
}

export async function reorderPlotPoints(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  const now = new Date().toISOString();
  for (const item of items) {
    db.update(plotPoints)
      .set({ sortOrder: item.sortOrder, updatedAt: now })
      .where(eq(plotPoints.id, item.id))
      .run();
  }
}
