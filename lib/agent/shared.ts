import OpenAI from 'openai';

import { appConfig } from '@/lib/agent/config';
import type { TeachingMode } from '@/lib/types';

export const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/** モック応答: API キーがない環境でも動作確認できるフォールバック */
export function buildFallbackReply(params: {
  mode: TeachingMode;
  latestUserMessage: string;
  retrievedContext: string;
}): string {
  const { mode, latestUserMessage, retrievedContext } = params;

  const modeLabel =
    mode === 'lecture' ? '書き方の講師モード' : mode === 'plot' ? 'プロット相談モード' : '短文改善モード';

  return [
    `1. ひとことで要約\n${modeLabel}として、今の悩みを小さく分解して進めるのが良さそうです。`,
    '2. 良い点\n- 何に困っているかが伝わっており、改善対象を絞りやすいです。\n- 最初から完璧を目指すより、問題を一つずつ見る姿勢に向いています。',
    '3. 改善ポイント\n- 悩みを「構成」「描写」「会話」など1カテゴリに絞ると、助言がより具体的になります。\n- 一つの場面で、主人公の目的と障害が見えるかを確認してみてください。',
    '4. すぐできる次の一歩\n- 今いちばん困っている1場面を100〜300字で貼る\n- その場面で主人公が何を望んでいるか1文で書く\n- 読者に感じてほしい感情を1つだけ決める',
    `5. 必要なら短い例\nたとえば「説明が多い」と感じるなら、「彼は悲しかった」を「返事は短く、視線は机の角に落ちた」のように反応へ置き換えると温度が出ます。\n\n参考メモ:\n${retrievedContext.slice(0, 280)}...\n\nあなたの入力:\n${latestUserMessage}`,
  ].join('\n\n');
}

/**
 * OpenAI Chat Completions API を呼び出して応答テキストを返す。
 * API キーがない場合や応答が空の場合はモック応答にフォールバックする。
 */
export async function callChatCompletion(params: {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  mode: TeachingMode;
  latestUserMessage: string;
  retrievedContext: string;
}): Promise<string> {
  const { systemPrompt, messages, mode, latestUserMessage, retrievedContext } = params;

  if (!openai) {
    return buildFallbackReply({ mode, latestUserMessage, retrievedContext });
  }

  const response = await openai.chat.completions.create({
    model: appConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
  });

  const content = response.choices[0]?.message?.content?.trim() ?? '';
  return content || buildFallbackReply({ mode, latestUserMessage, retrievedContext });
}
