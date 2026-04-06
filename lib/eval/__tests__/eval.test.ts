/**
 * 評価ユーティリティの単体テスト。
 * LLM の呼び出しはモック化し、採点ロジック・集計ロジックを検証する。
 */

import { describe, it, expect } from 'vitest';
import { mergeProfile } from '@/lib/memory/store';
import { evalDataset } from '@/lib/eval/dataset';
import type { LearnerProfile, RubricDimension } from '@/lib/types';

describe('mergeProfile', () => {
  const base: LearnerProfile = {
    level: 'beginner',
    goals: ['投稿したい'],
    recurringWeaknesses: ['説明が多い'],
    lastSuggestedActions: ['冒頭を修正する'],
  };

  it('既存プロフィールがない場合は incoming をそのまま返す', () => {
    const incoming: LearnerProfile = {
      level: 'beginner',
      goals: ['短編を完成させたい'],
      recurringWeaknesses: ['会話が不自然'],
      lastSuggestedActions: ['会話文を見直す'],
    };
    const merged = mergeProfile(null, incoming);
    expect(merged).toEqual(incoming);
  });

  it('goals と recurringWeaknesses は重複排除してマージされる', () => {
    const incoming: LearnerProfile = {
      level: 'beginner',
      goals: ['投稿したい', '短編を完成させたい'],
      recurringWeaknesses: ['説明が多い', '会話が不自然'],
      lastSuggestedActions: ['新しいアクション'],
    };
    const merged = mergeProfile(base, incoming);
    expect(merged.goals).toContain('投稿したい');
    expect(merged.goals).toContain('短編を完成させたい');
    expect(merged.goals.filter((g) => g === '投稿したい')).toHaveLength(1); // 重複なし
    expect(merged.recurringWeaknesses).toContain('説明が多い');
    expect(merged.recurringWeaknesses).toContain('会話が不自然');
  });

  it('lastSuggestedActions は incoming を優先する', () => {
    const incoming: LearnerProfile = {
      level: 'beginner',
      goals: [],
      recurringWeaknesses: [],
      lastSuggestedActions: ['新しいアクション'],
    };
    const merged = mergeProfile(base, incoming);
    expect(merged.lastSuggestedActions).toEqual(['新しいアクション']);
  });

  it('incoming の lastSuggestedActions が空の場合は既存を維持する', () => {
    const incoming: LearnerProfile = {
      level: 'beginner',
      goals: [],
      recurringWeaknesses: [],
      lastSuggestedActions: [],
    };
    const merged = mergeProfile(base, incoming);
    expect(merged.lastSuggestedActions).toEqual(base.lastSuggestedActions);
  });
});

describe('evalDataset', () => {
  const REQUIRED_DIMENSIONS: RubricDimension[] = [
    'clarity',
    'actionability',
    'beginnerFit',
    'grounding',
    'copyrightSafety',
  ];

  it('10件以上のケースが定義されている', () => {
    expect(evalDataset.length).toBeGreaterThanOrEqual(10);
  });

  it('全ケースに一意の id がある', () => {
    const ids = evalDataset.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('全ケースに5観点の expectedTraits が揃っている', () => {
    for (const evalCase of evalDataset) {
      for (const dim of REQUIRED_DIMENSIONS) {
        expect(evalCase.expectedTraits[dim], `${evalCase.id} の ${dim} が欠けている`).toBeTruthy();
      }
    }
  });

  it('全ケースに1件以上のユーザーメッセージがある', () => {
    for (const evalCase of evalDataset) {
      const userMessages = evalCase.input.messages.filter((m) => m.role === 'user');
      expect(userMessages.length, `${evalCase.id} にユーザーメッセージがない`).toBeGreaterThan(0);
    }
  });
});
