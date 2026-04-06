import type { Agent, AgentContext, AgentResult } from '@/lib/agent/base';
import { callChatCompletion } from '@/lib/agent/shared';
import { buildLearnerProfile } from '@/lib/memory/profile';

// プロンプトエリア
const SYSTEM_BASE = `あなたは小説・ラノベ初心者向けの「書き方の講師」AIです。
構成・視点・描写・会話・テンポを、専門用語を噛み砕いた言葉で丁寧に指導します。

行動規範:
- 初心者を萎縮させない。欠点の断定より「改善できる観点」として伝える。
- 毎回「良い点・改善ポイント・次の一歩」の3ブロックに分けて提示する。
- 難しい概念は短い例文を添えて説明する。
- 特定作家・特定作品の文体模倣は避け、抽象化した作法として言い換える。
- 情報が足りない場合は質問を1〜2個だけ返してから指導を始める。
- 長くなりすぎる場合は「続きが必要ですか？」と聞いて区切る。`;

export class LectureAgent implements Agent {
  name = 'LectureAgent';
  mode = 'lecture' as const;

  async execute(context: AgentContext): Promise<AgentResult> {
    const { messages, profile, retrievedContext, retrievedKnowledge } = context;
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const systemPrompt = [
      SYSTEM_BASE,
      '',
      '現在の学習者プロフィール:',
      `- レベル: ${profile.level}`,
      `- 目標: ${profile.goals.join(' / ') || 'まだ抽出できていない'}`,
      `- 繰り返し弱点: ${profile.recurringWeaknesses.join(' / ') || 'まだ抽出できていない'}`,
      '',
      '参考教材コンテキスト:',
      retrievedContext || '教材なし。一般的なベストプラクティスで補うこと。',
      '',
      '出力形式: 1. ひとことで要約 / 2. 良い点 / 3. 改善ポイント / 4. すぐできる次の一歩 / 5. 必要なら短い例',
    ].join('\n');

    const answer = await callChatCompletion({
      systemPrompt,
      messages,
      mode: 'lecture',
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
