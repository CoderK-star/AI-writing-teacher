import OpenAI from 'openai';

import { buildScorerSystemPrompt, buildScorerUserMessage } from '@/lib/eval/scorer-prompt';
import type { EvalCase, EvalResult, RubricDimension } from '@/lib/types';

const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? 'gpt-4.1';
const PASS_THRESHOLD = 2.5;

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY が設定されていません。評価スクリプトには API キーが必要です。');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * AIの回答を5観点でスコアリングする。
 * LLM-as-judge パターン: ジャッジ LLM に JSON 形式のスコアを要求する。
 */
export async function scoreReply(evalCase: EvalCase, agentAnswer: string): Promise<EvalResult> {
  const openai = getOpenAI();
  const systemPrompt = buildScorerSystemPrompt();
  const userMessage = buildScorerUserMessage({ evalCase, agentAnswer });

  const response = await openai.chat.completions.create({
    model: JUDGE_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const rawContent = response.choices[0]?.message?.content ?? '{}';

  let parsed: { scores?: Record<string, number>; reasoning?: string };
  try {
    parsed = JSON.parse(rawContent) as typeof parsed;
  } catch {
    parsed = {};
  }

  const dimensions: RubricDimension[] = ['clarity', 'actionability', 'beginnerFit', 'grounding', 'copyrightSafety'];
  const scores = Object.fromEntries(
    dimensions.map((dim) => [dim, clampScore(parsed.scores?.[dim] ?? 1)]),
  ) as Record<RubricDimension, number>;

  const averageScore = dimensions.reduce((sum, dim) => sum + scores[dim], 0) / dimensions.length;

  return {
    caseId: evalCase.id,
    caseName: evalCase.name,
    scores,
    reasoning: parsed.reasoning ?? '採点理由なし',
    pass: averageScore >= PASS_THRESHOLD,
  };
}

function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  return Math.min(4, Math.max(1, Math.round(num)));
}
