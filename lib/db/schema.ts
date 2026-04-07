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
  mode: text('mode', { enum: ['lecture', 'plot', 'revision', 'character'] }).notNull(),
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

/* ============================================================
   Zene — 執筆エディタ用テーブル
   ============================================================ */

/** 作品（プロジェクト）テーブル */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), // UUID v4
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  genre: text('genre'),
  synopsis: text('synopsis'),
  targetWordCount: integer('target_word_count'),
  status: text('status', { enum: ['draft', 'in-progress', 'complete'] })
    .notNull()
    .default('draft'),
  coverColor: text('cover_color'), // アバターカラー (hex)
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** 章テーブル */
export const chapters = sqliteTable('chapters', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  synopsis: text('synopsis'),
  status: text('status', { enum: ['draft', 'in-progress', 'complete'] })
    .notNull()
    .default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** シーンテーブル（最小執筆単位 — 1シーン = 1 Tiptap ドキュメント） */
export const scenes = sqliteTable('scenes', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  /** Tiptap JSON を文字列にシリアライズして格納 */
  content: text('content').notNull().default('{"type":"doc","content":[]}'),
  synopsis: text('synopsis'),
  /** 視点キャラクター ID (FK は任意) */
  povCharacterId: text('pov_character_id'),
  wordCount: integer('word_count').notNull().default(0),
  status: text('status', { enum: ['draft', 'in-progress', 'complete'] })
    .notNull()
    .default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** キャラクターテーブル */
export const characters = sqliteTable('characters', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role', {
    enum: ['protagonist', 'antagonist', 'supporting', 'minor'],
  })
    .notNull()
    .default('supporting'),
  gender: text('gender'),
  age: integer('age'),
  birthday: text('birthday'),
  height: text('height'),
  weight: text('weight'),
  personality: text('personality'),
  description: text('description'),
  backstory: text('backstory'),
  /** string[] を JSON にシリアライズ */
  traits: text('traits').notNull().default('[]'),
  notes: text('notes'),
  profileImage: text('profile_image'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** 世界設定テーブル */
export const worldSettings = sqliteTable('world_settings', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category', {
    enum: ['location', 'culture', 'magic-system', 'technology', 'other'],
  })
    .notNull()
    .default('other'),
  description: text('description').notNull().default(''),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** プロットポイントテーブル */
export const plotPoints = sqliteTable('plot_points', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  /** 章紐付け (null = 全体プロット) */
  chapterId: text('chapter_id')
    .references(() => chapters.id, { onDelete: 'cascade' }),
  /** スコープ: global = 全体プロット, chapter = 章別プロット */
  scope: text('scope', { enum: ['global', 'chapter'] })
    .notNull()
    .default('global'),
  title: text('title').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  type: text('type', {
    enum: ['setup', 'conflict', 'climax', 'resolution', 'other'],
  })
    .notNull()
    .default('other'),
  /** string[] (character ids) を JSON にシリアライズ */
  linkedCharacterIds: text('linked_character_ids').notNull().default('[]'),
  /** string[] (scene ids) を JSON にシリアライズ */
  linkedSceneIds: text('linked_scene_ids').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/* ============================================================
   構成機能 — プロットメーカー・時系列
   ============================================================ */

/** プロットメーカーカードテーブル（話数ごとのビジュアルプロットボード） */
export const plotMakerCards = sqliteTable('plot_maker_cards', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  /** 話数 (章) 紐付け */
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  /** カテゴリ: イベント / 世界観 / 読者の感情 / その他 */
  category: text('category', {
    enum: ['event', 'world', 'emotion', 'other'],
  })
    .notNull()
    .default('event'),
  /** テンプレート要素のキー (null = フリー入力) */
  templateKey: text('template_key'),
  /** ボード上の列位置 (0-based) */
  columnIndex: integer('column_index').notNull().default(0),
  /** ボード上の行位置 (0-based) */
  rowIndex: integer('row_index').notNull().default(0),
  /** カード背景色 (hex) */
  color: text('color'),
  /** string[] (character ids) を JSON にシリアライズ */
  linkedCharacterIds: text('linked_character_ids').notNull().default('[]'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** 時系列トラックテーブル（マトリクス表の行） */
export const timelineTracks = sqliteTable('timeline_tracks', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** トラック種別: プロット / 伏線 / 伏線回収 / キャラクター / カスタム */
  trackType: text('track_type', {
    enum: ['plot', 'foreshadow', 'resolution', 'character', 'custom'],
  })
    .notNull()
    .default('custom'),
  /** キャラクタートラックの場合のキャラ ID */
  characterId: text('character_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** 時系列セルテーブル（トラック × プロットポイント の交差セル） */
export const timelineCells = sqliteTable('timeline_cells', {
  id: text('id').primaryKey(),
  trackId: text('track_id')
    .notNull()
    .references(() => timelineTracks.id, { onDelete: 'cascade' }),
  /** プロットポイント列紐付け */
  plotPointId: text('plot_point_id')
    .notNull()
    .references(() => plotPoints.id, { onDelete: 'cascade' }),
  content: text('content').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** メモテーブル */
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  /** Tiptap JSON またはプレーンテキスト */
  content: text('content').notNull().default(''),
  /** string[] を JSON にシリアライズ */
  tags: text('tags').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** AI学習メモテーブル（スタンドアロンチャット用・ユーザーレベル） */
export const aiNotes = sqliteTable('ai_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  tags: text('tags').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** プロジェクトに紐づく AI チャットセッションテーブル */
export const projectChatSessions = sqliteTable('project_chat_sessions', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  /** 特定シーンに紐づける場合 (nullable) */
  sceneId: text('scene_id'),
  title: text('title').notNull(),
  mode: text('mode', { enum: ['lecture', 'plot', 'revision', 'character'] })
    .notNull()
    .default('revision'),
  /** ChatMessage[] を JSON にシリアライズ */
  messages: text('messages').notNull().default('[]'),
  /** GroundedReply | null */
  latestResult: text('latest_result'),
  updatedAt: text('updated_at').notNull(),
});
