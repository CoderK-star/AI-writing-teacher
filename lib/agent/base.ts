import type { ChatMessage, GroundedReply, KnowledgeChunk, LearnerProfile, TeachingMode } from '@/lib/types';

/** エージェントへの入力コンテキスト */
export type AgentContext = {
  mode: TeachingMode;
  messages: ChatMessage[];
  profile: LearnerProfile;
  retrievedKnowledge: KnowledgeChunk[];
  retrievedContext: string;
};

/** エージェントの出力結果（GroundedReply と同一型） */
export type AgentResult = GroundedReply;

/**
 * 各専門エージェントが実装するインターフェース。
 * 新しいモードを追加する場合は、このインターフェースを実装する1ファイルを追加するだけでよい。
 */
export interface Agent {
  /** エージェント名（ログ・デバッグ用） */
  name: string;
  /** エージェントが担当する TeachingMode */
  mode: TeachingMode;
  /** コンテキストを受け取り応答を生成する */
  execute(context: AgentContext): Promise<AgentResult>;
}
