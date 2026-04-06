import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { learnerProfiles } from '@/lib/db/schema';
import type { LearnerProfile } from '@/lib/types';

function parseProfile(row: typeof learnerProfiles.$inferSelect): LearnerProfile {
  return {
    level: 'beginner',
    goals: JSON.parse(row.goals) as string[],
    recurringWeaknesses: JSON.parse(row.recurringWeaknesses) as string[],
    lastSuggestedActions: JSON.parse(row.lastSuggestedActions) as string[],
  };
}

/** ユーザーの永続プロフィールを取得する。未登録なら null を返す。 */
export async function loadProfile(userId: string): Promise<LearnerProfile | null> {
  const row = db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).get();
  return row ? parseProfile(row) : null;
}

/**
 * 既存プロフィールと新しいプロフィールをマージして保存する。
 * 重複排除しながら累積する。lastSuggestedActions は最新のみ保持する。
 */
export async function saveProfile(userId: string, incoming: LearnerProfile): Promise<void> {
  const existing = await loadProfile(userId);
  const merged = mergeProfile(existing, incoming);

  db.insert(learnerProfiles)
    .values({
      userId,
      level: merged.level,
      goals: JSON.stringify(merged.goals),
      recurringWeaknesses: JSON.stringify(merged.recurringWeaknesses),
      lastSuggestedActions: JSON.stringify(merged.lastSuggestedActions),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: learnerProfiles.userId,
      set: {
        goals: JSON.stringify(merged.goals),
        recurringWeaknesses: JSON.stringify(merged.recurringWeaknesses),
        lastSuggestedActions: JSON.stringify(merged.lastSuggestedActions),
        updatedAt: new Date().toISOString(),
      },
    })
    .run();
}

/**
 * 2 つのプロフィールをマージして返す。
 * - goals / recurringWeaknesses: 重複排除して union
 * - lastSuggestedActions: incoming を優先
 */
export function mergeProfile(existing: LearnerProfile | null, incoming: LearnerProfile): LearnerProfile {
  if (!existing) return incoming;

  const uniq = (arr: string[]) => [...new Set(arr)];

  return {
    level: 'beginner',
    goals: uniq([...existing.goals, ...incoming.goals]),
    recurringWeaknesses: uniq([...existing.recurringWeaknesses, ...incoming.recurringWeaknesses]),
    lastSuggestedActions: incoming.lastSuggestedActions.length > 0
      ? incoming.lastSuggestedActions
      : existing.lastSuggestedActions,
  };
}
