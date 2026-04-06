import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

/**
 * データディレクトリが存在しなければ作成してから DB 接続を返す。
 * Next.js の Server Component / Route Handler から安全に使える。
 */
function createDbClient() {
  // data/ ディレクトリを確保
  const fs = require('fs') as typeof import('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return drizzle(sqlite, { schema });
}

// モジュールシングルトン（Next.js hot reload に HMR 対応）
const globalForDb = globalThis as unknown as { _db?: ReturnType<typeof createDbClient> };

export const db = globalForDb._db ?? createDbClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb._db = db;
}

export type DB = typeof db;
