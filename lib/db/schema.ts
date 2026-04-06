import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/** ユーザーテーブル: Cookie UUID で識別する匿名ユーザー */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID v4
  createdAt: text('created_at').notNull(),
});

/** 相談セッションテーブル */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // UUID v4
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  mode: text('mode', { enum: ['lecture', 'plot', 'revision'] }).notNull(),
  /** ChatMessage[] を JSON にシリアライズして格納 */
  messages: text('messages').notNull().default('[]'),
  /** GroundedReply | null を JSON にシリアライズして格納 */
  latestResult: text('latest_result'),
  updatedAt: text('updated_at').notNull(),
});

/** 学習者プロフィールテーブル: ユーザーごとに 1 行 */
export const learnerProfiles = sqliteTable('learner_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  level: text('level').notNull().default('beginner'),
  /** string[] を JSON にシリアライズ */
  goals: text('goals').notNull().default('[]'),
  recurringWeaknesses: text('recurring_weaknesses').notNull().default('[]'),
  lastSuggestedActions: text('last_suggested_actions').notNull().default('[]'),
  updatedAt: text('updated_at').notNull(),
});
