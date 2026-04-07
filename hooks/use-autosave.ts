import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

type Options = {
  projectId: string;
  sceneId: string | null;
  delay?: number; // ミリ秒、デフォルト 1500
};

/**
 * シーンコンテンツを自動保存するフック。
 *
 * - `setContent(json, wordCount)` を呼ぶと delay ミリ秒後に保存する。
 * - `flush()` を呼ぶと即座に保存する（ページ離脱前などに使用）。
 */
export function useAutosave({ projectId, sceneId, delay = 1500 }: Options) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const pendingRef = useRef<{ content: string; wordCount: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const save = useCallback(
    async (content: string, wordCount: number) => {
      if (!sceneId) return;

      // 前のリクエストをキャンセル
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSaveStatus('saving');
      try {
        const res = await fetch(
          `/api/projects/${projectId}/scenes/${sceneId}/content`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, wordCount }),
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error(`save failed: ${res.status}`);
        setSaveStatus('saved');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[useAutosave] save error:', err);
        setSaveStatus('unsaved');
      }
    },
    [projectId, sceneId],
  );

  /** コンテンツ変更を受け取り、遅延保存をスケジュールする */
  const setContent = useCallback(
    (content: string, wordCount: number) => {
      pendingRef.current = { content, wordCount };
      setSaveStatus('unsaved');

      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          save(pendingRef.current.content, pendingRef.current.wordCount);
          pendingRef.current = null;
        }
        timerRef.current = null;
      }, delay);
    },
    [delay, save],
  );

  /** 保留中の保存を即座に実行する */
  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) {
      save(pendingRef.current.content, pendingRef.current.wordCount);
      pendingRef.current = null;
    }
  }, [save]);

  // sceneId が変わったらフラッシュ
  const prevSceneIdRef = useRef<string | null>(sceneId);
  useEffect(() => {
    if (prevSceneIdRef.current !== sceneId) {
      flush();
      prevSceneIdRef.current = sceneId;
    }
  }, [sceneId, flush]);

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { saveStatus, setContent, flush };
}
