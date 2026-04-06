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
`);

sqlite.close();

console.log('✅ マイグレーション完了: data/app.db にテーブルを作成しました。');
