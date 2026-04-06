import type { ChatMessage, LearnerProfile } from '@/lib/types';

const weaknessRules = [
  { keyword: '説明', weakness: '説明が多くなりやすい' },
  { keyword: '会話', weakness: '会話文の自然さに不安がある' },
  { keyword: 'キャラ', weakness: 'キャラクターの立ち方を強化したい' },
  { keyword: 'プロット', weakness: 'プロットの起伏づくりを学びたい' },
  { keyword: '視点', weakness: '視点の安定性に注意が必要' },
  { keyword: '描写', weakness: '描写と説明のバランス調整が必要' },
];

const goalRules = [
  { keyword: '投稿', goal: '読める形で作品を投稿したい' },
  { keyword: '短編', goal: '短編を完成させたい' },
  { keyword: '長編', goal: '長編を設計したい' },
  { keyword: 'ラノベ', goal: 'ライトノベルらしい読みやすさを掴みたい' },
  { keyword: '面白', goal: '先が気になる展開を作りたい' },
];

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildLearnerProfile(messages: ChatMessage[], latestReply?: string): LearnerProfile {
  const userText = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join('\n');

  const recurringWeaknesses = uniq(
    weaknessRules.filter((rule) => userText.includes(rule.keyword)).map((rule) => rule.weakness),
  );

  const goals = uniq(goalRules.filter((rule) => userText.includes(rule.keyword)).map((rule) => rule.goal));

  const lastSuggestedActions = latestReply
    ? latestReply
        .split('\n')
        .filter((line) => /^[-・\d]/.test(line.trim()))
        .slice(0, 3)
        .map((line) => line.replace(/^[-・\d.\s]+/, '').trim())
        .filter(Boolean)
    : [];

  return {
    level: 'beginner',
    goals,
    recurringWeaknesses,
    lastSuggestedActions,
  };
}