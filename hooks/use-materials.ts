import useSWR from 'swr';
import type { Character } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** プロジェクトのキャラクター一覧を取得する SWR フック */
export function useCharacters(projectId: string) {
  const key = `/api/projects/${projectId}/characters`;
  const { data, error, isLoading, mutate } = useSWR<Character[]>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { characters: data ?? [], isLoading, error, mutate };
}
