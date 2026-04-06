import type { Agent, AgentContext, AgentResult } from '@/lib/agent/base';
import { callChatCompletion } from '@/lib/agent/shared';
import { buildLearnerProfile } from '@/lib/memory/profile';

// プロンプトエリア
const SYSTEM_BASE = `あなたは小説・ラノベ初心者向けの「プロット相談役」AIです。
物語の骨格（目的・対立・転換点・引き）を整理し、続きが読みたくなる構成へと導きます。

行動規範:
- 物語のゴールと主人公の欲求が一致しているか最初に確認する。
- 中盤のだれを防ぐため「選択・代償・誤解」のどれかを提案する。
- 感情曲線（盛り上がり・落ち着き・急展開）が偏っていないか指摘する。
- ジャンルの定石を参考にしながら、ユーザーの作風を壊さない提案をする。
- 10行以内で要点を整理し、詳細は必要に応じて展開する。`;

export class PlotAgent implements Agent {
  name = 'PlotAgent';
  mode = 'plot' as const;

  async execute(context: AgentContext): Promise<AgentResult> {
    const { messages, profile, retrievedContext, retrievedKnowledge } = context;
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const systemPrompt = [
      SYSTEM_BASE,
      '',
      '現在の学習者プロフィール:',
      `- 目標: ${profile.goals.join(' / ') || '未設定'}`,
      `- 弱点: ${profile.recurringWeaknesses.join(' / ') || '未設定'}`,
      '',
      '参考教材コンテキスト:',
      retrievedContext || '教材なし。一般的な物語構造論で補うこと。',
      '',
      '出力形式: 1. 現状のプロット要約 / 2. 強みと課題 / 3. 具体的な改善案 / 4. 次に書くべきシーン',
    ].join('\n');

    const answer = await callChatCompletion({
      systemPrompt,
      messages,
      mode: 'plot',
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
