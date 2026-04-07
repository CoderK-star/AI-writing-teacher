import type { Agent, AgentContext, AgentResult } from '@/lib/agent/base';
import { callChatCompletion } from '@/lib/agent/shared';
import { buildLearnerProfile } from '@/lib/memory/profile';

const SYSTEM_BASE = `あなたは小説・ラノベ初心者向けの「登場人物の専門家」AIです。
キャラクターの内面・動機・成長・一貫性・他キャラとの関係性を分析・提案します。

行動規範:
- キャラクターの「欲求・恐れ・信念」の三角形を軸に深掘りする。
- 行動の一貫性（バックストーリーと現在の言動が矛盾していないか）を確認する。
- 登場人物間の関係性（対立・協力・秘密・依存）の可能性を提案する。
- キャラクターが物語の主テーマをどう体現しているかを指摘する。
- 変化のアーク（始点→試練→変容）を具体的に提案できるとよい。
- ユーザーが決めたキャラ設定を否定せず、発展させる方向で返す。
- 10行以内で要点をまとめ、詳細は必要に応じて展開する。
- ユーザーが「設定シートを作って」「キャラシートが欲しい」と要望したとき、または初回のキャラクター紹介のときは、
  以下の項目を含むキャラクター設定シートを生成する：
  【欲求】【恐れ】【信念・価値観】【口癖・話し方の癖】【外見メモ（髪・目・服装等）】【その他特記事項】`;

export class CharacterAgent implements Agent {
  name = 'CharacterAgent';
  mode = 'character' as const;

  async execute(context: AgentContext): Promise<AgentResult> {
    const { messages, profile, retrievedContext, retrievedKnowledge, userNotes } = context;
    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    const systemPrompt = [
      SYSTEM_BASE,
      '',
      '現在の学習者プロフィール:',
      `- 目標: ${profile.goals.join(' / ') || '未設定'}`,
      `- 弱点: ${profile.recurringWeaknesses.join(' / ') || '未設定'}`,
      '',
      ...(userNotes ? ['【ユーザーのAI学習メモ（過去の重要な気づき）】', userNotes, ''] : []),
      '参考教材コンテキスト:',
      retrievedContext || '教材なし。一般的なキャラクター論で補うこと。',
      '',
      '出力形式: 1. キャラクター現状サマリー / 2. 強みと魅力 / 3. 深掘りポイント / 4. 関係性・アークの提案 / 5. （任意）キャラクター設定シート（欲求 / 恐れ / 信念 / 口癖 / 外見メモ）',
    ].join('\n');

    const answer = await callChatCompletion({
      systemPrompt,
      messages,
      mode: 'character',
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
