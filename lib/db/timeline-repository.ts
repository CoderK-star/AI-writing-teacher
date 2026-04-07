import { eq, asc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db/client';
import { timelineTracks, timelineCells, plotPoints } from '@/lib/db/schema';
import type {
  TimelineTrack,
  TimelineCell,
  TimelineTrackType,
  TimelineMatrix,
  PlotPoint,
  PlotType,
  PlotScope,
} from '@/lib/types';

// ─── Row → Type mappers ──────────────────────────────

function rowToTrack(row: typeof timelineTracks.$inferSelect): TimelineTrack {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    trackType: row.trackType as TimelineTrackType,
    characterId: row.characterId,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToCell(row: typeof timelineCells.$inferSelect): TimelineCell {
  return {
    id: row.id,
    trackId: row.trackId,
    plotPointId: row.plotPointId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

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

// ─── Tracks ──────────────────────────────────────────

export async function listTracks(projectId: string): Promise<TimelineTrack[]> {
  const rows = db
    .select()
    .from(timelineTracks)
    .where(eq(timelineTracks.projectId, projectId))
    .orderBy(asc(timelineTracks.sortOrder))
    .all();
  return rows.map(rowToTrack);
}

export async function createTrack(params: {
  id: string;
  projectId: string;
  name: string;
  trackType?: TimelineTrackType;
  characterId?: string | null;
  sortOrder: number;
}): Promise<TimelineTrack> {
  const now = new Date().toISOString();
  db.insert(timelineTracks)
    .values({
      id: params.id,
      projectId: params.projectId,
      name: params.name,
      trackType: params.trackType ?? 'custom',
      characterId: params.characterId ?? null,
      sortOrder: params.sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToTrack(
    db.select().from(timelineTracks).where(eq(timelineTracks.id, params.id)).get()!,
  );
}

export async function updateTrack(
  trackId: string,
  patch: Partial<Pick<TimelineTrack, 'name' | 'trackType' | 'characterId' | 'sortOrder'>>,
): Promise<TimelineTrack | null> {
  const now = new Date().toISOString();
  db.update(timelineTracks)
    .set({ ...patch, updatedAt: now })
    .where(eq(timelineTracks.id, trackId))
    .run();
  const row = db.select().from(timelineTracks).where(eq(timelineTracks.id, trackId)).get();
  return row ? rowToTrack(row) : null;
}

export async function deleteTrack(trackId: string): Promise<void> {
  db.delete(timelineTracks).where(eq(timelineTracks.id, trackId)).run();
}

export async function reorderTracks(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  const now = new Date().toISOString();
  for (const item of items) {
    db.update(timelineTracks)
      .set({ sortOrder: item.sortOrder, updatedAt: now })
      .where(eq(timelineTracks.id, item.id))
      .run();
  }
}

// ─── Cells ───────────────────────────────────────────

export async function listCells(trackId: string): Promise<TimelineCell[]> {
  const rows = db
    .select()
    .from(timelineCells)
    .where(eq(timelineCells.trackId, trackId))
    .all();
  return rows.map(rowToCell);
}

/**
 * セルを upsert する。content が空文字列なら削除。
 */
export async function upsertCell(
  trackId: string,
  plotPointId: string,
  content: string,
): Promise<TimelineCell | null> {
  const now = new Date().toISOString();
  const existing = db
    .select()
    .from(timelineCells)
    .where(
      and(
        eq(timelineCells.trackId, trackId),
        eq(timelineCells.plotPointId, plotPointId),
      ),
    )
    .get();

  if (!content.trim()) {
    // 空なら削除
    if (existing) {
      db.delete(timelineCells).where(eq(timelineCells.id, existing.id)).run();
    }
    return null;
  }

  if (existing) {
    db.update(timelineCells)
      .set({ content, updatedAt: now })
      .where(eq(timelineCells.id, existing.id))
      .run();
    return rowToCell(
      db.select().from(timelineCells).where(eq(timelineCells.id, existing.id)).get()!,
    );
  }

  const id = randomUUID();
  db.insert(timelineCells)
    .values({ id, trackId, plotPointId, content, createdAt: now, updatedAt: now })
    .run();
  return rowToCell(
    db.select().from(timelineCells).where(eq(timelineCells.id, id)).get()!,
  );
}

export async function deleteCell(cellId: string): Promise<void> {
  db.delete(timelineCells).where(eq(timelineCells.id, cellId)).run();
}

// ─── Matrix (全体取得) ───────────────────────────────

export async function getTimelineMatrix(projectId: string): Promise<TimelineMatrix> {
  const tracks = await listTracks(projectId);

  // 全体プロットのプロットポイントを列ヘッダーとして使う
  const ppRows = db
    .select()
    .from(plotPoints)
    .where(eq(plotPoints.projectId, projectId))
    .orderBy(asc(plotPoints.sortOrder))
    .all();
  const pps = ppRows.map(rowToPlot);

  // 全トラックのセルを取得
  const trackIds = tracks.map((t) => t.id);
  let cells: TimelineCell[] = [];
  for (const tid of trackIds) {
    const c = await listCells(tid);
    cells = cells.concat(c);
  }

  return { tracks, cells, plotPoints: pps };
}
