/**
 * データベースのマイグレーションスクリプト。
 *
 * 使用方法:
 *   npx tsx scripts/db-migrate.ts
 *
 * テーブルが存在しない場合のみ作成する（べき等操作）。
 */

import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

// data/ ディレクトリを確保
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

import Database from 'better-sqlite3';

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    mode          TEXT NOT NULL CHECK(mode IN ('lecture', 'plot', 'revision')),
    messages      TEXT NOT NULL DEFAULT '[]',
    latest_result TEXT,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS learner_profiles (
    user_id                  TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    level                    TEXT NOT NULL DEFAULT 'beginner',
    goals                    TEXT NOT NULL DEFAULT '[]',
    recurring_weaknesses     TEXT NOT NULL DEFAULT '[]',
    last_suggested_actions   TEXT NOT NULL DEFAULT '[]',
    updated_at               TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    genre             TEXT,
    synopsis          TEXT,
    target_word_count INTEGER,
    status            TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'in-progress', 'complete')),
    cover_color       TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    synopsis   TEXT,
    status     TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'in-progress', 'complete')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scenes (
    id                 TEXT PRIMARY KEY,
    chapter_id         TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    project_id         TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title              TEXT NOT NULL,
    sort_order         INTEGER NOT NULL DEFAULT 0,
    content            TEXT NOT NULL DEFAULT '{"type":"doc","content":[]}',
    synopsis           TEXT,
    pov_character_id   TEXT,
    word_count         INTEGER NOT NULL DEFAULT 0,
    status             TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'in-progress', 'complete')),
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS characters (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'supporting' CHECK(role IN ('protagonist', 'antagonist', 'supporting', 'minor')),
    description TEXT,
    backstory   TEXT,
    traits      TEXT NOT NULL DEFAULT '[]',
    notes       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS world_settings (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'other' CHECK(category IN ('location', 'culture', 'magic-system', 'technology', 'other')),
    description TEXT NOT NULL DEFAULT '',
    notes       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS plot_points (
    id                   TEXT PRIMARY KEY,
    project_id           TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id           TEXT REFERENCES chapters(id) ON DELETE CASCADE,
    scope                TEXT NOT NULL DEFAULT 'global' CHECK(scope IN ('global', 'chapter')),
    title                TEXT NOT NULL,
    description          TEXT,
    sort_order           INTEGER NOT NULL DEFAULT 0,
    type                 TEXT NOT NULL DEFAULT 'other' CHECK(type IN ('setup', 'conflict', 'climax', 'resolution', 'other')),
    linked_character_ids TEXT NOT NULL DEFAULT '[]',
    linked_scene_ids     TEXT NOT NULL DEFAULT '[]',
    created_at           TEXT NOT NULL,
    updated_at           TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS plot_maker_cards (
    id                   TEXT PRIMARY KEY,
    project_id           TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_id           TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title                TEXT NOT NULL,
    content              TEXT NOT NULL DEFAULT '',
    category             TEXT NOT NULL DEFAULT 'event' CHECK(category IN ('event', 'world', 'emotion', 'other')),
    template_key         TEXT,
    column_index         INTEGER NOT NULL DEFAULT 0,
    row_index            INTEGER NOT NULL DEFAULT 0,
    color                TEXT,
    linked_character_ids TEXT NOT NULL DEFAULT '[]',
    sort_order           INTEGER NOT NULL DEFAULT 0,
    created_at           TEXT NOT NULL,
    updated_at           TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timeline_tracks (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    track_type   TEXT NOT NULL DEFAULT 'custom' CHECK(track_type IN ('plot', 'foreshadow', 'resolution', 'character', 'custom')),
    character_id TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timeline_cells (
    id             TEXT PRIMARY KEY,
    track_id       TEXT NOT NULL REFERENCES timeline_tracks(id) ON DELETE CASCADE,
    plot_point_id  TEXT NOT NULL REFERENCES plot_points(id) ON DELETE CASCADE,
    content        TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    tags       TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_chat_sessions (
    id            TEXT PRIMARY KEY,
    project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scene_id      TEXT,
    title         TEXT NOT NULL,
    mode          TEXT NOT NULL DEFAULT 'revision' CHECK(mode IN ('lecture', 'plot', 'revision')),
    messages      TEXT NOT NULL DEFAULT '[]',
    latest_result TEXT,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_notes (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    tags       TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// ─── ALTER TABLE マイグレーション ───────────────────────────────
// CREATE TABLE IF NOT EXISTS は既存テーブルをスキップするため、
// 後から追加したカラムは個別に ALTER TABLE で追加する。

function addColumnIfNotExists(table: string, column: string, definition: string) {
  const exists = (
    sqlite
      .prepare(`SELECT COUNT(*) as cnt FROM pragma_table_info('${table}') WHERE name = ?`)
      .get(column) as { cnt: number }
  ).cnt > 0;
  if (!exists) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  + ${table}.${column} を追加しました。`);
  }
}

// notes テーブルに user_id を追加（スタンドアロンメモとの結合用）
addColumnIfNotExists('notes', 'user_id', 'TEXT');

// project_chat_sessions の mode に character を追加（CHECK 制約は再作成が必要なため個別対応不要）

// plot_points に scope・chapter_id を追加
addColumnIfNotExists(
  'plot_points',
  'chapter_id',
  "TEXT REFERENCES chapters(id) ON DELETE CASCADE",
);
addColumnIfNotExists(
  'plot_points',
  'scope',
  "TEXT NOT NULL DEFAULT 'global' CHECK(scope IN ('global', 'chapter'))",
);

// characters に詳細フィールドを追加
addColumnIfNotExists('characters', 'gender',      'TEXT');
addColumnIfNotExists('characters', 'age',         'INTEGER');
addColumnIfNotExists('characters', 'birthday',    'TEXT');
addColumnIfNotExists('characters', 'height',      'TEXT');
addColumnIfNotExists('characters', 'weight',      'TEXT');
addColumnIfNotExists('characters', 'personality', 'TEXT');
addColumnIfNotExists('characters', 'profile_image', 'TEXT');

sqlite.close();

console.log('✅ マイグレーション完了: data/app.db にテーブルを作成しました。');
