import useSWR from 'swr';
import type { ProjectDetail, Chapter, Scene } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`fetch error: ${res.status}`);
    return res.json() as Promise<ProjectDetail>;
  });

/**
 * プロジェクト詳細（章・シーン・キャラ・世界設定・プロット・メモ含む）を取得する SWR フック。
 */
export function useProject(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<ProjectDetail>(
    `/api/projects/${projectId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  /** 特定シーンを章ツリーから検索して返す */
  const findScene = (sceneId: string): Scene | null => {
    if (!data) return null;
    for (const chapter of data.chapters) {
      const scene = chapter.scenes?.find((s) => s.id === sceneId);
      if (scene) return scene;
    }
    return null;
  };

  /** 特定章を返す */
  const findChapter = (chapterId: string): Chapter | null => {
    if (!data) return null;
    return data.chapters.find((c) => c.id === chapterId) ?? null;
  };

  return {
    project: data ?? null,
    isLoading,
    error,
    mutate,
    findScene,
    findChapter,
  };
}
