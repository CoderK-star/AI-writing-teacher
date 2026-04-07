import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { characters } from '@/lib/db/schema';
import type { Character, CharacterRole } from '@/lib/types';

function rowToCharacter(row: typeof characters.$inferSelect): Character {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    role: row.role as CharacterRole,
    gender: row.gender ?? null,
    age: row.age ?? null,
    birthday: row.birthday ?? null,
    height: row.height ?? null,
    weight: row.weight ?? null,
    personality: row.personality ?? null,
    description: row.description,
    backstory: row.backstory,
    traits: JSON.parse(row.traits) as string[],
    notes: row.notes,
    profileImage: row.profileImage ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** プロジェクトの全キャラクターを取得 */
export async function listCharacters(projectId: string): Promise<Character[]> {
  const rows = db
    .select()
    .from(characters)
    .where(eq(characters.projectId, projectId))
    .orderBy(asc(characters.createdAt))
    .all();
  return rows.map(rowToCharacter);
}

/** キャラクターを 1 件取得 */
export async function getCharacter(characterId: string): Promise<Character | null> {
  const row = db.select().from(characters).where(eq(characters.id, characterId)).get();
  return row ? rowToCharacter(row) : null;
}

/** キャラクターを作成 */
export async function createCharacter(params: {
  id: string;
  projectId: string;
  name: string;
  role?: CharacterRole;
}): Promise<Character> {
  const now = new Date().toISOString();
  db.insert(characters)
    .values({
      id: params.id,
      projectId: params.projectId,
      name: params.name,
      role: params.role ?? 'supporting',
      description: null,
      backstory: null,
      traits: '[]',
      notes: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return rowToCharacter(
    db.select().from(characters).where(eq(characters.id, params.id)).get()!,
  );
}

/** キャラクターを更新 */
export async function updateCharacter(
  characterId: string,
  patch: Partial<Pick<Character, 'name' | 'role' | 'gender' | 'age' | 'birthday' | 'height' | 'weight' | 'personality' | 'description' | 'backstory' | 'traits' | 'notes' | 'profileImage'>>,
): Promise<Character | null> {
  const now = new Date().toISOString();
  const dbPatch = {
    ...patch,
    traits: patch.traits !== undefined ? JSON.stringify(patch.traits) : undefined,
    updatedAt: now,
  };
  db.update(characters).set(dbPatch).where(eq(characters.id, characterId)).run();
  return getCharacter(characterId);
}

/** キャラクターを削除 */
export async function deleteCharacter(characterId: string): Promise<void> {
  db.delete(characters).where(eq(characters.id, characterId)).run();
}
