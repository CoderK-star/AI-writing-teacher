import useSWR from 'swr';
import type {
  PlotPoint,
  PlotMakerCard,
  TimelineMatrix,
} from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** プロットポイント (scope/chapter フィルタ付き) */
export function usePlotPoints(
  projectId: string,
  options?: { scope?: 'global' | 'chapter'; chapterId?: string },
) {
  const params = new URLSearchParams();
  if (options?.scope) params.set('scope', options.scope);
  if (options?.chapterId) params.set('chapterId', options.chapterId);
  const qs = params.toString();
  const key = `/api/projects/${projectId}/plot${qs ? `?${qs}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<PlotPoint[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { plotPoints: data ?? [], isLoading, error, mutate };
}

/** プロットメーカーカード */
export function usePlotMaker(projectId: string, chapterId?: string) {
  const qs = chapterId ? `?chapterId=${chapterId}` : '';
  const key = chapterId
    ? `/api/projects/${projectId}/plot-maker${qs}`
    : null; // chapterId が無い場合はフェッチしない
  const { data, error, isLoading, mutate } = useSWR<PlotMakerCard[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { cards: data ?? [], isLoading, error, mutate };
}

/** 時系列マトリクス */
export function useTimeline(projectId: string) {
  const key = `/api/projects/${projectId}/timeline`;
  const { data, error, isLoading, mutate } = useSWR<TimelineMatrix>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return {
    matrix: data ?? { tracks: [], cells: [], plotPoints: [] },
    isLoading,
    error,
    mutate,
  };
}
