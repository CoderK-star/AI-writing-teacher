import type { Agent } from '@/lib/agent/base';
import { LectureAgent } from '@/lib/agent/agents/lecture-agent';
import { PlotAgent } from '@/lib/agent/agents/plot-agent';
import { RevisionAgent } from '@/lib/agent/agents/revision-agent';
import { CharacterAgent } from '@/lib/agent/agents/character-agent';
import type { TeachingMode } from '@/lib/types';

/** 利用可能なエージェント一覧（シングルトン） */
const agentRegistry: Record<TeachingMode, Agent> = {
  lecture: new LectureAgent(),
  plot: new PlotAgent(),
  revision: new RevisionAgent(),
  character: new CharacterAgent(),
};

/**
 * TeachingMode に対応するエージェントを返す。
 * 将来的に LLM ベースの意図判定ルーターに差し替え可能。
 */
export function routeToAgent(mode: TeachingMode): Agent {
  return agentRegistry[mode];
}
