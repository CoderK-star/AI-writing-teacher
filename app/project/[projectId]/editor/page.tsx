'use client';

import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { Settings, Eye, MoonStar, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChapterTree } from '@/components/project/chapter-tree';
import { ChatPanel } from '@/components/chat/chat-panel';
import { useProject } from '@/hooks/use-project';
import { useAutosave } from '@/hooks/use-autosave';
import type { Scene } from '@/lib/types';
import { cn } from '@/lib/utils';

// Tiptap はサーバーサイドレンダリング不可
const TiptapEditor = dynamic(
  () => import('@/components/editor/tiptap-editor').then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
      エディタを読み込み中…
    </div>
  );
}

const statusLabel: Record<string, string> = {
  draft: '下書き',
  'in-progress': '執筆中',
  complete: '完成',
};

const statusVariant: Record<string, 'secondary' | 'outline' | 'default'> = {
  draft: 'secondary',
  'in-progress': 'outline',
  complete: 'default',
};

const EDITOR_THEME_STORAGE_KEY = 'zene:editor-content-theme';

type EditorTheme = 'light' | 'dark';

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const { project, isLoading, mutate } = useProject(projectId);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [chatVisible, setChatVisible] = useState(true);
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('light');

  const { saveStatus, setContent, flush } = useAutosave({
    projectId,
    sceneId: activeSceneId,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const persistedTheme = window.localStorage.getItem(EDITOR_THEME_STORAGE_KEY);

    if (persistedTheme === 'light' || persistedTheme === 'dark') {
      setEditorTheme(persistedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(EDITOR_THEME_STORAGE_KEY, editorTheme);
  }, [editorTheme]);

  /** シーンを選択したときの処理 */
  const handleSelectScene = useCallback(
    (scene: Scene) => {
      // 切り替え前に現在のシーンを保存
      flush();
      setActiveSceneId(scene.id);
      setActiveScene(scene);
    },
    [flush],
  );

  /** エディタ更新コールバック */
  const handleEditorUpdate = useCallback(
    (json: string, wordCount: number) => {
      setContent(json, wordCount);
    },
    [setContent],
  );

  const isEditorDark = editorTheme === 'dark';

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-muted-foreground">
        プロジェクトを読み込み中…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">プロジェクトが見つかりません。</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            ダッシュボードへ戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ─── トップバー ─── */}
      <header className="h-11 flex items-center gap-3 px-3 border-b border-border/60 shrink-0">
        {/* プロジェクトカラーバー */}
        <div
          className="h-4 w-1 rounded-full shrink-0"
          style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
        />

        <h1 className="text-sm font-semibold truncate max-w-xs">{project.title}</h1>

        <Badge variant={statusVariant[project.status] ?? 'secondary'} className="text-xs">
          {statusLabel[project.status] ?? project.status}
        </Badge>

        {activeScene && (
          <>
            <span className="text-muted-foreground/50 text-xs">/</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {activeScene.title}
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-7 w-7', isEditorDark && 'bg-muted')}
                  onClick={() => setEditorTheme((current) => (current === 'light' ? 'dark' : 'light'))}
                  aria-label={`本文テーマを${isEditorDark ? 'ライト' : 'ダーク'}に切り替え`}
                >
                  {isEditorDark ? <MoonStar className="w-4 h-4" /> : <SunMedium className="w-4 h-4" />}
                </Button>
              }
            />
            <TooltipContent>
              本文テーマ: {isEditorDark ? 'ダーク' : 'ライト'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-7 w-7', chatVisible && 'bg-muted')}
                  onClick={() => setChatVisible((v) => !v)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              }
            />
            <TooltipContent>AIチャットパネル {chatVisible ? '非表示' : '表示'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { flush(); router.push(`/project/${projectId}`); }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              }
            />
            <TooltipContent>プロジェクト設定</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* ─── 3ペインメインエリア ─── */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* 左: 章・シーンツリー */}
          <ResizablePanel
            id="tree"
            defaultSize="18%"
            minSize="220px"
            maxSize="30%"
            className="border-r border-border/50"
          >
            <div className="h-full overflow-y-auto">
              <ChapterTree
                projectId={projectId}
                chapters={project?.chapters}
                activeSceneId={activeSceneId}
                onSelectScene={handleSelectScene}
                onMutate={() => { mutate(); }}
                onStructureClick={() => { flush(); router.push(`/project/${projectId}/structure`); }}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 中央: エディタ */}
          <ResizablePanel
            id="editor"
            defaultSize={chatVisible ? '57%' : '82%'}
            minSize="420px"
          >
            <div className="h-full flex flex-col">
              {activeScene ? (
                <>
                  {/* シーンタイトル */}
                  <div className="px-6 pt-5 pb-1 shrink-0">
                    <h2 className="text-xl font-semibold text-foreground">{activeScene.title}</h2>
                    {activeScene.synopsis && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {activeScene.synopsis}
                      </p>
                    )}
                  </div>
                  {/* エディタ本体 */}
                  <div className={cn('flex-1 overflow-hidden px-6 pb-6', isEditorDark && 'dark')}>
                    <div className="h-full rounded-[28px] border border-border/60 bg-card shadow-sm overflow-hidden">
                      <TiptapEditor
                        content={activeScene.content}
                        onUpdate={handleEditorUpdate}
                        saveStatus={saveStatus}
                        placeholder="シーンの本文を書き始めましょう…"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3 text-muted-foreground">
                    <p className="text-3xl opacity-30">✍</p>
                    <p className="text-sm">左のツリーからシーンを選択してください</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* 右: AI チャット (非表示時は折りたたむ) */}
          {chatVisible && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                id="chat"
                defaultSize="25%"
                minSize="280px"
                maxSize="40%"
                className="border-l border-border/50"
              >
                <div className="h-full overflow-hidden">
                  <ChatPanel projectId={projectId} sceneId={activeSceneId} />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
