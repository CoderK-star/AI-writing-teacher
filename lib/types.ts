export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type TeachingMode = 'lecture' | 'plot' | 'revision' | 'character';

export type LearnerProfile = {
  level: 'beginner';
  goals: string[];
  recurringWeaknesses: string[];
  lastSuggestedActions: string[];
};

export type KnowledgeChunk = {
  id: string;
  title: string;
  topic: string;
  content: string;
  tags: string[];
  /** ベクタ検索用の埋め込みベクタ（インデックス登録後に付与） */
  embedding?: number[];
};

export type GroundedReply = {
  answer: string;
  citations: Array<Pick<KnowledgeChunk, 'id' | 'title' | 'topic'>>;
  profile: LearnerProfile;
  retrieved: KnowledgeChunk[];
};

export type ChatSession = {
  id: string;
  title: string;
  mode: TeachingMode;
  messages: ChatMessage[];
  latestResult: GroundedReply | null;
  updatedAt: string;
};

// ─── 評価関連の型 ─────────────────────────────────────

/** ルーブリック5観点 */
export type RubricDimension = 'clarity' | 'actionability' | 'beginnerFit' | 'grounding' | 'copyrightSafety';

/** 評価テストケース */
export type EvalCase = {
  id: string;
  name: string;
  input: {
    mode: TeachingMode;
    messages: ChatMessage[];
  };
  /** 各観点において期待される回答の特徴を自然言語で記述 */
  expectedTraits: Record<RubricDimension, string>;
};

/** 1ケースの採点結果 */
export type EvalResult = {
  caseId: string;
  caseName: string;
  /** 各観点のスコア (1〜4) */
  scores: Record<RubricDimension, number>;
  reasoning: string;
  /** 全観点平均 >= 2.5 を pass とする */
  pass: boolean;
};

/** 全テストスイートの集計結果 */
export type EvalSuiteResult = {
  results: EvalResult[];
  averageScores: Record<RubricDimension, number>;
  overallAverage: number;
  passCount: number;
  totalCount: number;
};

// ─── Zene — 執筆エディタ用の型 ─────────────────────────────────────

export type ProjectStatus = 'draft' | 'in-progress' | 'complete';
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';
export type WorldCategory = 'location' | 'culture' | 'magic-system' | 'technology' | 'other';
export type PlotType = 'setup' | 'conflict' | 'climax' | 'resolution' | 'other';
export type PlotScope = 'global' | 'chapter';
export type PlotMakerCategory = 'event' | 'world' | 'emotion' | 'other';
export type TimelineTrackType = 'plot' | 'foreshadow' | 'resolution' | 'character' | 'custom';

/** 作品（プロジェクト） */
export type Project = {
  id: string;
  userId: string;
  title: string;
  genre: string | null;
  synopsis: string | null;
  targetWordCount: number | null;
  status: ProjectStatus;
  coverColor: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 章 */
export type Chapter = {
  id: string;
  projectId: string;
  title: string;
  sortOrder: number;
  synopsis: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  /** ネスト取得時のシーン一覧 */
  scenes?: Scene[];
};

/** シーン（最小執筆単位） */
export type Scene = {
  id: string;
  chapterId: string;
  projectId: string;
  title: string;
  sortOrder: number;
  /** Tiptap JSON document */
  content: string;
  synopsis: string | null;
  povCharacterId: string | null;
  wordCount: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

/** キャラクター */
export type Character = {
  id: string;
  projectId: string;
  name: string;
  role: CharacterRole;
  gender: string | null;
  age: number | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  personality: string | null;
  description: string | null;
  backstory: string | null;
  traits: string[];
  notes: string | null;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 世界設定 */
export type WorldSetting = {
  id: string;
  projectId: string;
  name: string;
  category: WorldCategory;
  description: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** プロットポイント */
export type PlotPoint = {
  id: string;
  projectId: string;
  chapterId: string | null;
  scope: PlotScope;
  title: string;
  description: string | null;
  sortOrder: number;
  type: PlotType;
  linkedCharacterIds: string[];
  linkedSceneIds: string[];
  createdAt: string;
  updatedAt: string;
};

/** プロットメーカーカード */
export type PlotMakerCard = {
  id: string;
  projectId: string;
  chapterId: string;
  title: string;
  content: string;
  category: PlotMakerCategory;
  templateKey: string | null;
  columnIndex: number;
  rowIndex: number;
  color: string | null;
  linkedCharacterIds: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** 時系列トラック（マトリクスの行） */
export type TimelineTrack = {
  id: string;
  projectId: string;
  name: string;
  trackType: TimelineTrackType;
  characterId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** 時系列セル（トラック × プロットポイント交差点） */
export type TimelineCell = {
  id: string;
  trackId: string;
  plotPointId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

/** 時系列マトリクスの完全データ */
export type TimelineMatrix = {
  tracks: TimelineTrack[];
  cells: TimelineCell[];
  plotPoints: PlotPoint[];
};

/** メモ */
export type Note = {
  id: string;
  projectId: string;
  userId: string | null;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

/** AI学習メモ（スタンドアロンチャット用） */
export type AiNote = {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

/** プロジェクト紐づき AI チャットセッション */
export type ProjectChatSession = {
  id: string;
  projectId: string;
  sceneId: string | null;
  title: string;
  mode: TeachingMode;
  messages: ChatMessage[];
  latestResult: GroundedReply | null;
  updatedAt: string;
};

/** プロジェクト詳細（章+シーン+キャラ+世界設定を含む） */
export type ProjectDetail = Project & {
  chapters: Chapter[];
  characters: Character[];
  worldSettings: WorldSetting[];
  plotPoints: PlotPoint[];
  notes: Note[];
  totalWordCount: number;
};