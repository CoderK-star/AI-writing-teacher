'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { usePlotPoints } from '@/hooks/use-structure';
import type { Chapter, PlotPoint, PlotType } from '@/lib/types';

type Props = {
  projectId: string;
  chapters: Chapter[];
};

// ─── 入力ダイアログ ───────────────────────────────────────────────────────────

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
  open, title, label, value, onChange, onConfirm, onClose, loading, confirmLabel = '追加',
}: InputDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !loading) { e.preventDefault(); onConfirm(); }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">{label}</label>
          <Input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="タイトルを入力…" className="h-9" />
        </div>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="outline" size="sm" onClick={onClose} />}>キャンセル</DialogClose>
          <Button size="sm" onClick={onConfirm} disabled={!value.trim() || loading}>
            {loading ? '処理中…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 削除確認ダイアログ ───────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  open, title, description, onConfirm, onClose, loading,
}: { open: boolean; title: string; description: string; onConfirm: () => void; onClose: () => void; loading?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="outline" size="sm" onClick={onClose} />}>キャンセル</DialogClose>
          <Button size="sm" variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? '削除中…' : '削除する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const kishoutenketsu: { type: PlotType; label: string; color: string }[] = [
  { type: 'setup', label: '起', color: '#3b82f6' },
  { type: 'conflict', label: '承', color: '#f97316' },
  { type: 'climax', label: '転', color: '#ef4444' },
  { type: 'resolution', label: '結', color: '#22c55e' },
];

// ─── ダイアログ状態定数 ─────────────────────────────────────────────────────

const CLOSED_ADD_PLOT    = { open: false, type: null as PlotType | null, title: '' };
const CLOSED_DEL_PLOT    = { open: false, plotId: '', titleLabel: '' };

export function PlotView({ projectId, chapters }: Props) {
  // scope tab: 'global' or chapterId
  const [activeScope, setActiveScope] = useState<string>('global');

  const isGlobal = activeScope === 'global';
  const scope = isGlobal ? 'global' : 'chapter';
  const chapterId = isGlobal ? undefined : activeScope;

  const { plotPoints, mutate } = usePlotPoints(projectId, { scope, chapterId });

  const [addDialog, setAddDialog] = useState<{ open: boolean; type: PlotType | null; title: string }>(CLOSED_ADD_PLOT);
  const [delDialog, setDelDialog] = useState<{ open: boolean; plotId: string; titleLabel: string }>(CLOSED_DEL_PLOT);
  const [apiLoading, setApiLoading] = useState<string | null>(null);

  // ── ハンドラー ─────────────────────────────────────

  const handleAdd = useCallback(
    (type: PlotType) => setAddDialog({ open: true, type, title: '' }),
    [],
  );

  const handleAddConfirm = useCallback(async () => {
    if (!addDialog.title.trim() || !addDialog.type) return;
    setApiLoading('add');
    try {
      await fetch(`/api/projects/${projectId}/plot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addDialog.title.trim(),
          type: addDialog.type,
          scope,
          chapterId: chapterId ?? null,
        }),
      });
      setAddDialog(CLOSED_ADD_PLOT);
      mutate();
    } finally {
      setApiLoading(null);
    }
  }, [addDialog, projectId, scope, chapterId, mutate]);

  const handleDelete = useCallback(
    (plotId: string, titleLabel: string) =>
      setDelDialog({ open: true, plotId, titleLabel }),
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    setApiLoading(`del-${delDialog.plotId}`);
    try {
      await fetch(`/api/projects/${projectId}/plot/${delDialog.plotId}`, { method: 'DELETE' });
      setDelDialog(CLOSED_DEL_PLOT);
      mutate();
    } finally {
      setApiLoading(null);
    }
  }, [delDialog, projectId, mutate]);

  const handleUpdateDescription = useCallback(
    async (plotId: string, description: string) => {
      await fetch(`/api/projects/${projectId}/plot/${plotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      mutate();
    },
    [projectId, mutate],
  );

  // ── タイプ別にグルーピング ─────────────────────────

  const pointsByType = kishoutenketsu.reduce(
    (acc, k) => {
      acc[k.type] = plotPoints.filter((pp) => pp.type === k.type);
      return acc;
    },
    {} as Record<PlotType, PlotPoint[]>,
  );

  return (
    <div className="h-full flex flex-col">
      {/* タブバー */}
      <div className="shrink-0 border-b border-border/50 px-4 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveScope('global')}
          className={cn(
            'px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors',
            activeScope === 'global'
              ? 'border-primary text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          全体プロット
        </button>
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveScope(ch.id)}
            className={cn(
              'px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors',
              activeScope === ch.id
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {ch.title}
          </button>
        ))}
      </div>

      {/* 4カラム 起承転結 */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-4 gap-0 min-h-full">
          {kishoutenketsu.map((k) => (
            <div
              key={k.type}
              className="border-r border-border/30 last:border-r-0 flex flex-col"
            >
              {/* カラムヘッダー */}
              <div
                className="sticky top-0 z-10 px-3 py-2.5 border-b border-border/30 bg-muted/50 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: k.color }}
                    />
                    <span className="font-semibold text-sm">{k.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {pointsByType[k.type]?.length ?? 0}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleAdd(k.type as PlotType)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* カード一覧 */}
              <div className="flex-1 p-2 space-y-2">
                {(pointsByType[k.type] ?? []).map((pp) => (
                  <PlotCard
                    key={pp.id}
                    point={pp}
                    color={k.color}
                    onDelete={handleDelete}
                    onUpdateDescription={(desc) =>
                      handleUpdateDescription(pp.id, desc)
                    }
                  />
                ))}
                {(pointsByType[k.type] ?? []).length === 0 && (
                  <button
                    onClick={() => handleAdd(k.type as PlotType)}
                    className="w-full border border-dashed border-border/50 rounded-lg p-4 text-xs text-muted-foreground hover:border-border hover:bg-muted/30 transition-colors"
                  >
                    + プロットポイントを追加
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ダイアログ */}
      <InputDialog
        open={addDialog.open}
        title="プロットポイントを追加"
        label="タイトル"
        value={addDialog.title}
        onChange={(v) => setAddDialog((s) => ({ ...s, title: v }))}
        onConfirm={handleAddConfirm}
        onClose={() => setAddDialog(CLOSED_ADD_PLOT)}
        loading={apiLoading === 'add'}
        confirmLabel="追加"
      />
      <ConfirmDeleteDialog
        open={delDialog.open}
        title="プロットポイントを削除"
        description={`「${delDialog.titleLabel}」を削除しますか？この操作は元に戻せません。`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDelDialog(CLOSED_DEL_PLOT)}
        loading={apiLoading === `del-${delDialog.plotId}`}
      />
    </div>
  );
}

// ── プロットカード ──────────────────────────────────────

function PlotCard({
  point,
  color,
  onDelete,
  onUpdateDescription,
}: {
  point: PlotPoint;
  color: string;
  onDelete: (id: string, title: string) => void;
  onUpdateDescription: (description: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(point.description ?? '');

  const handleBlur = () => {
    setEditing(false);
    if (desc !== (point.description ?? '')) {
      onUpdateDescription(desc);
    }
  };

  return (
    <div
      className="group bg-background border border-border/40 rounded-lg p-3 shadow-sm hover:shadow transition-shadow"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{point.title}</p>
          {editing ? (
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={handleBlur}
              autoFocus
              className="mt-1.5 w-full text-xs bg-muted/50 border border-border/40 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              rows={3}
              placeholder="説明を入力…"
            />
          ) : (
            <p
              className="mt-1 text-xs text-muted-foreground line-clamp-3 cursor-pointer hover:text-foreground transition-colors"
              onClick={() => setEditing(true)}
            >
              {point.description || 'クリックして説明を追加…'}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onDelete(point.id, point.title)}
        >
          <Trash2 className="w-3 h-3 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
