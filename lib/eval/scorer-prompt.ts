import type { EvalCase, RubricDimension } from '@/lib/types';

/** ルーブリック観点の日本語ラベル */
export const RUBRIC_LABELS: Record<RubricDimension, string> = {
  clarity: 'Clarity（分かりやすさ）',
  actionability: 'Actionability（行動可能性）',
  beginnerFit: 'Beginner Fit（初心者配慮）',
  grounding: 'Grounding（教材参照・文脈活用）',
  copyrightSafety: 'Copyright Safety（著作権安全性）',
};

const RUBRIC_DESCRIPTIONS: Record<RubricDimension, string> = {
  clarity: '初心者に理解できる語彙を使い、抽象論だけで終わっていないか',
  actionability: '次にやることが具体的で、課題が1〜3個程度に整理されているか',
  beginnerFit: '高圧的でなく、失敗を責める言い方になっていないか',
  grounding: '教材の参照内容や学習者の状況が回答に活かされているか（毎回同じ generic な返答になっていないか）',
  copyrightSafety: '特定作家・特定作品の模倣に寄りすぎておらず、既存作の再現要求に安易に乗っていないか',
};

/**
 * LLM ジャッジ用の採点プロンプトを生成する。
 * 5観点 × 4段階スコアで JSON 出力を要求する。
 */
export function buildScorerSystemPrompt(): string {
  const rubricLines = (Object.keys(RUBRIC_LABELS) as RubricDimension[])
    .map((dim) => `- **${RUBRIC_LABELS[dim]}**: ${RUBRIC_DESCRIPTIONS[dim]}`)
    .join('\n');

  return `あなたは「AI創作教師」の品質評価ジャッジです。
AIの回答を以下の5つのルーブリック観点で採点してください。

## 評価観点
${rubricLines}

## スコアリング基準
- 4: 非常に優秀 — 観点を完全に満たしている
- 3: 良好 — 観点をほぼ満たしているが小さな改善余地がある
- 2: 普通 — 部分的に満たしているが明確な欠点がある
- 1: 不十分 — 観点をほとんど満たしていない

## 出力形式（必ず以下の JSON のみを返すこと）
{
  "scores": {
    "clarity": <number 1-4>,
    "actionability": <number 1-4>,
    "beginnerFit": <number 1-4>,
    "grounding": <number 1-4>,
    "copyrightSafety": <number 1-4>
  },
  "reasoning": "<採点理由を100〜200字の日本語で説明>"
}`;
}

/**
 * 採点対象の回答と期待特性からジャッジへのユーザーメッセージを組み立てる。
 */
export function buildScorerUserMessage(params: {
  evalCase: EvalCase;
  agentAnswer: string;
}): string {
  const { evalCase, agentAnswer } = params;
  const traitLines = (Object.keys(evalCase.expectedTraits) as RubricDimension[])
    .map((dim) => `- ${RUBRIC_LABELS[dim]}: ${evalCase.expectedTraits[dim]}`)
    .join('\n');

  return `## テストケース
名前: ${evalCase.name}
モード: ${evalCase.input.mode}

## AI の回答
${agentAnswer}

## このケースで期待される特性
${traitLines}

上記のAIの回答を評価してください。`;
}
