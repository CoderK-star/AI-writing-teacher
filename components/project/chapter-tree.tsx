'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  Trash2,
  Book,
  Pencil,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Chapter, Scene } from '@/lib/types';

type Props = {
  projectId: string;
  chapters?: Chapter[];
  activeSceneId: string | null;
  onSceneSelect?: (scene: Scene) => void;
  onSelectScene?: (scene: Scene) => void;
  onRefresh?: () => void;
  onMutate?: () => void;
  onStructureClick?: () => void;
};

// ─── ダイアログ状態の型 ───────────────────────────────────────────────────────

type AddChapterDialog    = { open: boolean; title: string };
type AddSceneDialog      = { open: boolean; chapterId: string; title: string };
type DeleteChapterDialog = { open: boolean; chapterId: string; titleLabel: string };
type DeleteSceneDialog   = { open: boolean; sceneId: string; titleLabel: string };
type RenameChapterDialog = { open: boolean; chapterId: string; title: string };
type RenameSceneDialog   = { open: boolean; sceneId: string; title: string };

const CLOSED_ADD_CHAPTER:    AddChapterDialog    = { open: false, title: '' };
const CLOSED_ADD_SCENE:      AddSceneDialog      = { open: false, chapterId: '', title: '' };
const CLOSED_DEL_CHAPTER:    DeleteChapterDialog = { open: false, chapterId: '', titleLabel: '' };
const CLOSED_DEL_SCENE:      DeleteSceneDialog   = { open: false, sceneId: '', titleLabel: '' };
const CLOSED_RENAME_CHAPTER: RenameChapterDialog = { open: false, chapterId: '', title: '' };
const CLOSED_RENAME_SCENE:   RenameSceneDialog   = { open: false, sceneId: '', title: '' };

// ─── テキスト入力ダイアログ ──────────────────────────────────────────────────

type InputDialogProps = {
  open: boolean;
  title: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  confirmLabel?: string;
};

function InputDialog({
  open,
  title,
  label,
  value,
  onChange,
  onConfirm,
  onClose,
  loading,
  confirmLabel = '作成',
}: InputDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !loading) {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">{label}</label>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タイトルを入力…"
            className="h-9"
          />
        </div>
        <DialogFooter className="gap-2">
          <DialogClose
            render={<Button variant="outline" size="sm" onClick={onClose} />}
          >
            キャンセル
          </DialogClose>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!value.trim() || loading}
          >
            {loading ? '処理中…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 削除確認ダイアログ ──────────────────────────────────────────────────────

type ConfirmDeleteDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

function ConfirmDeleteDialog({
  open,
  title,
  description,
  onConfirm,
  onClose,
  loading,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <DialogFooter className="gap-2">
          <DialogClose
            render={<Button variant="outline" size="sm" onClick={onClose} />}
          >
            キャンセル
          </DialogClose>
          <Button
            size="sm"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '削除中…' : '削除する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ChapterTree 本体 ────────────────────────────────────────────────────────

export function ChapterTree({
  projectId,
  chapters: chaptersProp,
  activeSceneId,
  onSceneSelect: onSceneSelectProp,
  onSelectScene,
  onRefresh: onRefreshProp,
  onMutate,
  onStructureClick,
}: Props) {
  const chapters = chaptersProp ?? [];
  const onSceneSelect = onSelectScene ?? onSceneSelectProp ?? (() => {});
  const onRefresh = onMutate ?? onRefreshProp ?? (() => {});

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    () => new Set(chapters.map((c) => c.id)),
  );
  const [loading, setLoading] = useState<string | null>(null);

  // ダイアログ状態
  const [addChapter,    setAddChapter]    = useState<AddChapterDialog>(CLOSED_ADD_CHAPTER);
  const [addScene,      setAddScene]      = useState<AddSceneDialog>(CLOSED_ADD_SCENE);
  const [delChapter,    setDelChapter]    = useState<DeleteChapterDialog>(CLOSED_DEL_CHAPTER);
  const [delScene,      setDelScene]      = useState<DeleteSceneDialog>(CLOSED_DEL_SCENE);
  const [renameChapter, setRenameChapter] = useState<RenameChapterDialog>(CLOSED_RENAME_CHAPTER);
  const [renameScene,   setRenameScene]   = useState<RenameSceneDialog>(CLOSED_RENAME_SCENE);

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── 章を追加 ─────────────────────────────────────────────────────────────
  const handleAddChapterConfirm = useCallback(async () => {
    if (!addChapter.title.trim()) return;
    setLoading('add-chapter');
    try {
      await fetch(`/api/projects/${projectId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: addChapter.title.trim() }),
      });
      setAddChapter(CLOSED_ADD_CHAPTER);
      onRefresh();
    } finally {
      setLoading(null);
    }
  }, [addChapter.title, projectId, onRefresh]);

  // ─── シーンを追加 ────────────────────────────────────────────────────────
  const handleAddSceneConfirm = useCallback(async () => {
    if (!addScene.title.trim()) return;
    setLoading(`add-scene-${addScene.chapterId}`);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/chapters/${addScene.chapterId}/scenes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: addScene.title.trim() }),
        },
      );
      if (res.ok) {
        const scene = await res.json() as Scene;
        setAddScene(CLOSED_ADD_SCENE);
        onRefresh();
        onSceneSelect(scene);
      }
    } finally {
      setLoading(null);
    }
  }, [addScene, projectId, onRefresh, onSceneSelect]);

  // ─── 章を削除 ─────────────────────────────────────────────────────────────
  const handleDeleteChapterConfirm = useCallback(async () => {
    setLoading(`del-chapter-${delChapter.chapterId}`);
    try {
      await fetch(`/api/projects/${projectId}/chapters/${delChapter.chapterId}`, {
        method: 'DELETE',
      });
      setDelChapter(CLOSED_DEL_CHAPTER);
      onRefresh();
    } finally {
      setLoading(null);
    }
  }, [delChapter, projectId, onRefresh]);

  // ─── シーンを削除 ────────────────────────────────────────────────────────
  const handleDeleteSceneConfirm = useCallback(async () => {
    setLoading(`del-scene-${delScene.sceneId}`);
    try {
      await fetch(`/api/projects/${projectId}/scenes/${delScene.sceneId}`, {
        method: 'DELETE',
      });
      setDelScene(CLOSED_DEL_SCENE);
      onRefresh();
    } finally {
      setLoading(null);
    }
  }, [delScene, projectId, onRefresh]);

  // ─── 章タイトルを変更 ─────────────────────────────────────────────────────
  const handleRenameChapterConfirm = useCallback(async () => {
    if (!renameChapter.title.trim()) return;
    setLoading(`rename-chapter-${renameChapter.chapterId}`);
    try {
      await fetch(`/api/projects/${projectId}/chapters/${renameChapter.chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameChapter.title.trim() }),
      });
      setRenameChapter(CLOSED_RENAME_CHAPTER);
      onRefresh();
    } finally {
      setLoading(null);
    }
  }, [renameChapter, projectId, onRefresh]);

  // ─── シーンタイトルを変更 ─────────────────────────────────────────────────
  const handleRenameSceneConfirm = useCallback(async () => {
    if (!renameScene.title.trim()) return;
    setLoading(`rename-scene-${renameScene.sceneId}`);
    try {
      await fetch(`/api/projects/${projectId}/scenes/${renameScene.sceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameScene.title.trim() }),
      });
      setRenameScene(CLOSED_RENAME_SCENE);
      onRefresh();
    } finally {
      setLoading(null);
    }
  }, [renameScene, projectId, onRefresh]);

  // ─── レンダリング ────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full">
        {/* 構成ボタン */}
        {onStructureClick && (
          <button
            onClick={onStructureClick}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-b border-border/50"
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            構成
          </button>
        )}

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Book className="w-3.5 h-3.5" />
            章 / シーン
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setAddChapter({ open: true, title: '' })}
            disabled={loading === 'add-chapter'}
            title="章を追加"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {chapters.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                「+」ボタンで章を追加
              </div>
            ) : (
              chapters.map((chapter) => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters.has(chapter.id)}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <div className="group flex items-center gap-0.5 rounded-md hover:bg-muted/50 transition-colors">
                    <CollapsibleTrigger className="flex items-center gap-1 flex-1 min-w-0 p-1.5 text-left w-full text-left">
                      {expandedChapters.has(chapter.id) ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium truncate">{chapter.title}</span>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 pr-1 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        title="シーンを追加"
                        onClick={() => setAddScene({ open: true, chapterId: chapter.id, title: '' })}
                        disabled={loading === `add-scene-${chapter.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                        title="章のタイトルを変更"
                        onClick={() =>
                          setRenameChapter({ open: true, chapterId: chapter.id, title: chapter.title })
                        }
                        disabled={loading === `rename-chapter-${chapter.id}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        title="章を削除"
                        onClick={() =>
                          setDelChapter({ open: true, chapterId: chapter.id, titleLabel: chapter.title })
                        }
                        disabled={loading === `del-chapter-${chapter.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="ml-4 space-y-0.5">
                      {(chapter.scenes ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-1">シーンなし</p>
                      ) : (
                        (chapter.scenes ?? []).map((scene) => (
                          <div
                            key={scene.id}
                            className={cn(
                              'group flex items-center gap-1 rounded-md hover:bg-muted/50 transition-colors',
                              activeSceneId === scene.id && 'bg-primary/10 hover:bg-primary/15',
                            )}
                          >
                            <button
                              className="flex items-center gap-1.5 flex-1 min-w-0 p-1.5 text-left"
                              onClick={() => onSceneSelect(scene)}
                            >
                              <FileText
                                className={cn(
                                  'w-3 h-3 shrink-0',
                                  activeSceneId === scene.id ? 'text-primary' : 'text-muted-foreground',
                                )}
                              />
                              <span
                                className={cn(
                                  'text-sm truncate',
                                  activeSceneId === scene.id
                                    ? 'text-primary font-medium'
                                    : 'text-foreground/80',
                                )}
                              >
                                {scene.title}
                              </span>
                            </button>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 pr-1 transition-opacity shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                title="シーンのタイトルを変更"
                                onClick={() =>
                                  setRenameScene({ open: true, sceneId: scene.id, title: scene.title })
                                }
                                disabled={loading === `rename-scene-${scene.id}`}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                title="シーンを削除"
                                onClick={() =>
                                  setDelScene({ open: true, sceneId: scene.id, titleLabel: scene.title })
                                }
                                disabled={loading === `del-scene-${scene.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ─── ダイアログ群 ─────────────────────────────────────────────────── */}

      {/* 章を追加 */}
      <InputDialog
        open={addChapter.open}
        title="章を追加"
        label="章のタイトル"
        value={addChapter.title}
        onChange={(v) => setAddChapter((s) => ({ ...s, title: v }))}
        onConfirm={handleAddChapterConfirm}
        onClose={() => setAddChapter(CLOSED_ADD_CHAPTER)}
        loading={loading === 'add-chapter'}
        confirmLabel="追加"
      />

      {/* シーンを追加 */}
      <InputDialog
        open={addScene.open}
        title="シーンを追加"
        label="シーンのタイトル"
        value={addScene.title}
        onChange={(v) => setAddScene((s) => ({ ...s, title: v }))}
        onConfirm={handleAddSceneConfirm}
        onClose={() => setAddScene(CLOSED_ADD_SCENE)}
        loading={loading === `add-scene-${addScene.chapterId}`}
        confirmLabel="追加"
      />

      {/* 章タイトルを変更 */}
      <InputDialog
        open={renameChapter.open}
        title="章のタイトルを変更"
        label="新しいタイトル"
        value={renameChapter.title}
        onChange={(v) => setRenameChapter((s) => ({ ...s, title: v }))}
        onConfirm={handleRenameChapterConfirm}
        onClose={() => setRenameChapter(CLOSED_RENAME_CHAPTER)}
        loading={loading === `rename-chapter-${renameChapter.chapterId}`}
        confirmLabel="変更"
      />

      {/* シーンタイトルを変更 */}
      <InputDialog
        open={renameScene.open}
        title="シーンのタイトルを変更"
        label="新しいタイトル"
        value={renameScene.title}
        onChange={(v) => setRenameScene((s) => ({ ...s, title: v }))}
        onConfirm={handleRenameSceneConfirm}
        onClose={() => setRenameScene(CLOSED_RENAME_SCENE)}
        loading={loading === `rename-scene-${renameScene.sceneId}`}
        confirmLabel="変更"
      />

      {/* 章を削除 */}
      <ConfirmDeleteDialog
        open={delChapter.open}
        title="章を削除"
        description={`章「${delChapter.titleLabel}」を削除しますか？シーンもすべて削除されます。この操作は元に戻せません。`}
        onConfirm={handleDeleteChapterConfirm}
        onClose={() => setDelChapter(CLOSED_DEL_CHAPTER)}
        loading={loading === `del-chapter-${delChapter.chapterId}`}
      />

      {/* シーンを削除 */}
      <ConfirmDeleteDialog
        open={delScene.open}
        title="シーンを削除"
        description={`シーン「${delScene.titleLabel}」を削除しますか？この操作は元に戻せません。`}
        onConfirm={handleDeleteSceneConfirm}
        onClose={() => setDelScene(CLOSED_DEL_SCENE)}
        loading={loading === `del-scene-${delScene.sceneId}`}
      />
    </>
  );
}
