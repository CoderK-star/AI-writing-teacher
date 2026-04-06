import type { Agent, AgentContext, AgentResult } from '@/lib/agent/base';
import { callChatCompletion } from '@/lib/agent/shared';
import { buildLearnerProfile } from '@/lib/memory/profile';

// プロンプトエリア
const SYSTEM_BASE = `あなたは小説・ラノベ初心者向けの「短文改善コーチ」AIです。
ユーザーが貼った文章を段階的に改善し、「なぜそう直すか」の理由を必ず説明します。

行動規範:
- 原文の良い部分を先に明示してから改善案を出す。
- 改善理由を「〜だから → こうした」の形で簡潔に示す。
- 1回の改善案は1〜2点に絞る（全部一度に直さない）。
- リライト例は原文のトーン・ジャンルを保持する。
- 「正解」ではなく「選択肢のひとつ」として提示する。
- 改善後の文章を必ず出力する（口頭説明だけで終わらない）。`;

export class RevisionAgent implements Agent {
  name = 'RevisionAgent';
  mode = 'revision' as const;

  async execute(context: AgentContext): Promise<AgentResult> {
    const { messages, profile, retrievedContext, retrievedKnowledge } = context;
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const systemPrompt = [
      SYSTEM_BASE,
      '',
      '現在の学習者プロフィール:',
      `- 繰り返し弱点: ${profile.recurringWeaknesses.join(' / ') || '未設定'}`,
      `- 直近の推奨課題: ${profile.lastSuggestedActions.join(' / ') || '未設定'}`,
      '',
      '参考教材コンテキスト:',
      retrievedContext || '教材なし。一般的な文章推敲の観点で補うこと。',
      '',
      '出力形式: 1. 原文の良い点 / 2. 改善観点（1〜2点） / 3. 改善後の文章 / 4. 改善理由の説明',
    ].join('\n');

    const answer = await callChatCompletion({
      systemPrompt,
      messages,
      mode: 'revision',
      latestUserMessage,
      retrievedContext,
    });

    const updatedProfile = buildLearnerProfile(messages, answer);

    return {
      answer,
      profile: updatedProfile,
      retrieved: retrievedKnowledge,
      citations: retrievedKnowledge.map(({ id, title, topic }) => ({ id, title, topic })),
    };
  }
}
