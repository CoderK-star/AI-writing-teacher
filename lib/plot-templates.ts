import type { PlotMakerCategory } from '@/lib/types';

export type PlotTemplate = {
  key: string;
  label: string;
  category: PlotMakerCategory;
  description: string;
  defaultColor: string;
  group: 'foundation' | 'event' | 'world' | 'emotion';
};

/** 土台づくり系テンプレート */
const foundation: PlotTemplate[] = [
  { key: 'protagonist_entry', label: '主人公の登場', category: 'event', description: '主人公が読者に初めて紹介されるシーン', defaultColor: '#3b82f6', group: 'foundation' },
  { key: 'protagonist_goal', label: '主人公のゴール提示', category: 'event', description: '主人公が達成したい目標が明確になるシーン', defaultColor: '#3b82f6', group: 'foundation' },
  { key: 'story_goal', label: '物語のゴール提示', category: 'event', description: '物語全体が向かうべきゴールが示されるシーン', defaultColor: '#3b82f6', group: 'foundation' },
  { key: 'opening_event', label: '物語の開幕を告げるイベント', category: 'event', description: '物語が動き出す決定的なイベント', defaultColor: '#3b82f6', group: 'foundation' },
  { key: 'antagonist_entry', label: '重要な敵の登場', category: 'event', description: '主人公の障害となる敵や対立者が登場するシーン', defaultColor: '#ef4444', group: 'foundation' },
  { key: 'hero_heroine_entry', label: 'ヒーロー/ヒロインの登場', category: 'event', description: '主人公を助ける重要なキャラクターが登場するシーン', defaultColor: '#3b82f6', group: 'foundation' },
  { key: 'precious_entry', label: '大切な存在の登場', category: 'emotion', description: '主人公にとって本能的に庇護欲がそそられる人物・危機から守ってくれた人物等が登場', defaultColor: '#f97316', group: 'foundation' },
  { key: 'partner_entry', label: '相棒の登場', category: 'event', description: '主人公と共に行動する相棒が登場するシーン', defaultColor: '#3b82f6', group: 'foundation' },
  { key: 'protagonist_charm', label: '主人公の魅力の提示', category: 'emotion', description: '主人公の人間的魅力が読者に伝わるシーン', defaultColor: '#f97316', group: 'foundation' },
];

/** イベント系テンプレート */
const events: PlotTemplate[] = [
  { key: 'shocking_event', label: '衝撃的な展開への興味', category: 'event', description: '読者が興味を持たない状態から、死・性的なもの・裏切り・意外な展開で注意を惹きつけるイベント', defaultColor: '#3b82f6', group: 'event' },
  { key: 'protagonist_background', label: '主人公の背景の説明', category: 'event', description: '主人公の過去や生い立ちが明かされるシーン', defaultColor: '#3b82f6', group: 'event' },
  { key: 'protagonist_nature', label: '主人公の性質の説明', category: 'event', description: '主人公の性格や特徴的な行動パターンが示されるシーン', defaultColor: '#3b82f6', group: 'event' },
  { key: 'turning_point', label: 'ターニングポイント', category: 'event', description: '物語の方向性が大きく変わる転換点', defaultColor: '#8b5cf6', group: 'event' },
  { key: 'climax_event', label: 'クライマックス', category: 'event', description: '物語の最高潮となるシーン', defaultColor: '#ef4444', group: 'event' },
  { key: 'resolution_event', label: '解決・結末', category: 'event', description: '物語の問題が解決し、結末を迎えるシーン', defaultColor: '#22c55e', group: 'event' },
];

/** 世界観系テンプレート */
const world: PlotTemplate[] = [
  { key: 'world_intro', label: '世界観の提示', category: 'world', description: '物語の舞台や世界の特徴が読者に紹介されるシーン', defaultColor: '#14b8a6', group: 'world' },
  { key: 'world_rule', label: '世界のルール説明', category: 'world', description: '物語世界の独自のルールや仕組みが説明されるシーン', defaultColor: '#14b8a6', group: 'world' },
  { key: 'world_conflict', label: '世界の対立構造', category: 'world', description: '物語世界における大きな対立構造が提示されるシーン', defaultColor: '#14b8a6', group: 'world' },
];

/** 読者の感情系テンプレート */
const emotions: PlotTemplate[] = [
  { key: 'reader_sympathy', label: '主人公への同情', category: 'emotion', description: '正当性を持つ主人公が理不尽な目に遭うことで同情を生み出す', defaultColor: '#f97316', group: 'emotion' },
  { key: 'reader_expectation', label: '主人公への期待感', category: 'emotion', description: '主人公に強みがあると提示されることによる将来的な勝利展開への期待感', defaultColor: '#f97316', group: 'emotion' },
  { key: 'enemy_stress', label: '敵へのストレス', category: 'emotion', description: '敵が傲り高ぶることで読者にストレスを与え、主人公への応援心を強める', defaultColor: '#f97316', group: 'emotion' },
  { key: 'catharsis', label: 'カタルシス', category: 'emotion', description: '溜めたストレスを一気に解放する爽快なシーン', defaultColor: '#f97316', group: 'emotion' },
  { key: 'emotional_peak', label: '感動のピーク', category: 'emotion', description: '読者の感情が最も揺さぶられるシーン', defaultColor: '#f97316', group: 'emotion' },
];

export const plotTemplates: PlotTemplate[] = [
  ...foundation,
  ...events,
  ...world,
  ...emotions,
];

export const templatesByGroup: Record<PlotTemplate['group'], PlotTemplate[]> = {
  foundation,
  event: events,
  world,
  emotion: emotions,
};

export const templateGroupLabels: Record<PlotTemplate['group'], string> = {
  foundation: 'おすすめ',
  event: 'イベント',
  world: '世界観',
  emotion: '感情',
};
