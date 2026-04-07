import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { plotMakerCards } from '@/lib/db/schema';
import type { PlotMakerCard, PlotMakerCategory } from '@/lib/types';

function rowToCard(row: typeof plotMakerCards.$inferSelect): PlotMakerCard {
  return {
    id: row.id,
    projectId: row.projectId,
    chapterId: row.chapterId,
    title: row.title,
    content: row.content,
    category: row.category as PlotMakerCategory,
    templateKey: row.templateKey,
    columnIndex: row.columnIndex,
    rowIndex: row.rowIndex,
    color: row.color,
    linkedCharacterIds: JSON.parse(row.linkedCharacterIds) as string[],
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listCards(
  projectId: string,
  chapterId?: string,
): Promise<PlotMakerCard[]> {
  const conditions = [eq(plotMakerCards.projectId, projectId)];
  if (chapterId) {
    conditions.push(eq(plotMakerCards.chapterId, chapterId));
  }
  const rows = db
    .select()
    .from(plotMakerCards)
    .where(and(...conditions))
    .orderBy(asc(plotMakerCards.sortOrder))
    .all();
  return rows.map(rowToCard);
}

export async function getCard(cardId: string): Promise<PlotMakerCard | null> {
  const row = db
    .select()
    .from(plotMakerCards)
    .where(eq(plotMakerCards.id, cardId))
    .get();
  return row ? rowToCard(row) : null;
}

export async function createCard(params: {
  id: string;
  projectId: string;
  chapterId: string;
  title: string;
  content?: string;
  category?: PlotMakerCategory;
  templateKey?: string | null;
  columnIndex?: number;
  rowIndex?: number;
  color?: string | null;
  sortOrder: number;
}): Promise<PlotMakerCard> {
  const now = new Date().toISOString();
  db.insert(plotMakerCards)
    .values({
      id: params.id,
      projectId: params.projectId,
      chapterId: params.chapterId,
      title: params.title,
      content: params.content ?? '',
      category: params.category ?? 'event',
      templateKey: params.templateKey ?? null,
      columnIndex: params.columnIndex ?? 0,
      rowIndex: params.rowIndex ?? 0,
      color: params.color ?? null,
      linkedCharacterIds: '[]',
      sortOrder: params.sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToCard(
    db.select().from(plotMakerCards).where(eq(plotMakerCards.id, params.id)).get()!,
  );
}

export async function updateCard(
  cardId: string,
  patch: Partial<
    Pick<
      PlotMakerCard,
      | 'title'
      | 'content'
      | 'category'
      | 'templateKey'
      | 'columnIndex'
      | 'rowIndex'
      | 'color'
      | 'linkedCharacterIds'
      | 'sortOrder'
    >
  >,
): Promise<PlotMakerCard | null> {
  const now = new Date().toISOString();
  const dbPatch = {
    ...patch,
    linkedCharacterIds:
      patch.linkedCharacterIds !== undefined
        ? JSON.stringify(patch.linkedCharacterIds)
        : undefined,
    updatedAt: now,
  };
  db.update(plotMakerCards).set(dbPatch).where(eq(plotMakerCards.id, cardId)).run();
  return getCard(cardId);
}

export async function deleteCard(cardId: string): Promise<void> {
  db.delete(plotMakerCards).where(eq(plotMakerCards.id, cardId)).run();
}

export async function reorderCards(
  items: Array<{ id: string; sortOrder: number; columnIndex?: number; rowIndex?: number }>,
): Promise<void> {
  const now = new Date().toISOString();
  for (const item of items) {
    const set: Record<string, unknown> = { sortOrder: item.sortOrder, updatedAt: now };
    if (item.columnIndex !== undefined) set.columnIndex = item.columnIndex;
    if (item.rowIndex !== undefined) set.rowIndex = item.rowIndex;
    db.update(plotMakerCards)
      .set(set)
      .where(eq(plotMakerCards.id, item.id))
      .run();
  }
}
