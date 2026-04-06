export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type TeachingMode = 'lecture' | 'plot' | 'revision';

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