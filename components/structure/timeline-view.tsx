'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
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
import { useTimeline } from '@/hooks/use-structure';
import type { Character, TimelineTrack, TimelineCell } from '@/lib/types';

type Props = {
  projectId: string;
  characters: Character[];
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
            onKeyDown={handleKeyDown} placeholder="名前を入力…" className="h-9" />
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

// ─── ダイアログ状態定数 ─────────────────────────────────────────────────────

const CLOSED_CUSTOM_TRACK = { open: false, name: '' };
const CLOSED_DEL_TRACK    = { open: false, trackId: '', trackName: '' };

const trackTypeLabels: Record<string, string> = {
  plot: 'プロット',
  foreshadow: '伏線',
  resolution: '伏線回収',
  character: 'キャラクター',
  custom: 'カスタム',
};

const trackTypeColors: Record<string, string> = {
  plot: '#3b82f6',
  foreshadow: '#8b5cf6',
  resolution: '#22c55e',
  character: '#f97316',
  custom: '#6b7280',
};

export function TimelineView({ projectId, characters }: Props) {
  const { matrix, mutate } = useTimeline(projectId);

  const [customTrackDialog, setCustomTrackDialog] = useState<{ open: boolean; name: string }>(CLOSED_CUSTOM_TRACK);
  const [delTrackDialog, setDelTrackDialog] = useState<{ open: boolean; trackId: string; trackName: string }>(CLOSED_DEL_TRACK);
  const [apiLoading, setApiLoading] = useState<string | null>(null);

  // ── トラック追加 ───────────────────────────────────

  const handleAddTrack = useCallback(
    async (trackType: TimelineTrack['trackType'], characterId?: string) => {
      if (trackType === 'custom') {
        setCustomTrackDialog({ open: true, name: '' });
        return;
      }
      let name: string;
      if (trackType === 'character') {
        const char = characters.find((c) => c.id === characterId);
        name = char?.name ?? 'キャラクター';
      } else {
        name = trackTypeLabels[trackType] ?? 'カスタム';
      }
      setApiLoading(`add-${trackType}`);
      try {
        await fetch(`/api/projects/${projectId}/timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, trackType, characterId: characterId ?? null }),
        });
        mutate();
      } finally {
        setApiLoading(null);
      }
    },
    [projectId, characters, mutate],
  );

  const handleCustomTrackConfirm = useCallback(async () => {
    if (!customTrackDialog.name.trim()) return;
    setApiLoading('add-custom');
    try {
      await fetch(`/api/projects/${projectId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customTrackDialog.name.trim(), trackType: 'custom', characterId: null }),
      });
      setCustomTrackDialog(CLOSED_CUSTOM_TRACK);
      mutate();
    } finally {
      setApiLoading(null);
    }
  }, [customTrackDialog.name, projectId, mutate]);

  const handleDeleteTrack = useCallback(
    (trackId: string, trackName: string) =>
      setDelTrackDialog({ open: true, trackId, trackName }),
    [],
  );

  const handleDeleteTrackConfirm = useCallback(async () => {
    setApiLoading(`del-${delTrackDialog.trackId}`);
    try {
      await fetch(`/api/projects/${projectId}/timeline/${delTrackDialog.trackId}`, { method: 'DELETE' });
      setDelTrackDialog(CLOSED_DEL_TRACK);
      mutate();
    } finally {
      setApiLoading(null);
    }
  }, [delTrackDialog, projectId, mutate]);

  // ── セル更新 ───────────────────────────────────────

  const handleCellUpdate = useCallback(
    async (trackId: string, plotPointId: string, content: string) => {
      await fetch(`/api/projects/${projectId}/timeline/cells`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, plotPointId, content }),
      });
      mutate();
    },
    [projectId, mutate],
  );

  // ── セルの高速検索マップ ───────────────────────────

  const cellMap = new Map<string, TimelineCell>();
  for (const cell of matrix.cells) {
    cellMap.set(`${cell.trackId}:${cell.plotPointId}`, cell);
  }

  const plotPoints = matrix.plotPoints;
  const tracks = matrix.tracks;

  // キャラクターでまだトラックに追加されていないもの
  const existingCharIds = new Set(
    tracks.filter((t) => t.trackType === 'character').map((t) => t.characterId),
  );
  const availableCharacters = characters.filter(
    (c) => !existingCharIds.has(c.id),
  );

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div className="shrink-0 border-b border-border/50 px-4 py-2.5 flex items-center gap-2">
        <span className="text-sm font-medium">時系列マトリクス</span>
        <Badge variant="secondary" className="text-xs">
          {tracks.length} トラック × {plotPoints.length} ポイント
        </Badge>
        <div className="flex-1" />

        {/* トラック追加メニュー */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleAddTrack('plot')}
          >
            <Plus className="w-3 h-3" /> プロット
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleAddTrack('foreshadow')}
          >
            <Plus className="w-3 h-3" /> 伏線
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleAddTrack('resolution')}
          >
            <Plus className="w-3 h-3" /> 伏線回収
          </Button>
          {availableCharacters.length > 0 && (
            <select
              className="h-7 text-xs border border-border rounded-md px-2 bg-background"
              value=""
              onChange={(e) => {
                if (e.target.value)
                  handleAddTrack('character', e.target.value);
              }}
            >
              <option value="">+ キャラクター</option>
              {availableCharacters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleAddTrack('custom')}
          >
            <Plus className="w-3 h-3" /> カスタム
          </Button>
        </div>
      </div>

      {/* マトリクス表 */}
      <div className="flex-1 overflow-auto">
        {plotPoints.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            プロットポイントを追加すると、時系列の列が表示されます。
            <br />
            まず「プロット」タブでプロットポイントを作成してください。
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                {/* 行ヘッダー列 */}
                <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur border-b border-r border-border/40 p-2 w-40 min-w-[160px]" />
                {/* プロットポイント列ヘッダー */}
                {plotPoints.map((pp) => (
                  <th
                    key={pp.id}
                    className="border-b border-r border-border/40 bg-muted/50 p-2 min-w-[160px] max-w-[200px]"
                  >
                    <div className="text-xs font-medium text-foreground truncate">
                      {pp.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {pp.type === 'setup'
                        ? '起'
                        : pp.type === 'conflict'
                          ? '承'
                          : pp.type === 'climax'
                            ? '転'
                            : pp.type === 'resolution'
                              ? '結'
                              : ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id} className="group/row">
                  {/* 行ヘッダー */}
                  <td className="sticky left-0 z-10 bg-background border-b border-r border-border/40 p-2">
                    <div className="flex items-center gap-2">
                      {track.trackType === 'character' ? (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      ) : (
                        <div
                          className="w-2 h-6 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              trackTypeColors[track.trackType] ?? '#6b7280',
                          }}
                        />
                      )}
                      <span className="text-xs font-medium truncate flex-1">
                        {track.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleDeleteTrack(track.id, track.name)}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </td>

                  {/* セル */}
                  {plotPoints.map((pp) => (
                    <td
                      key={pp.id}
                      className="border-b border-r border-border/30 p-0"
                    >
                      <TimelineCellEditor
                        value={
                          cellMap.get(`${track.id}:${pp.id}`)?.content ?? ''
                        }
                        onSave={(content) =>
                          handleCellUpdate(track.id, pp.id, content)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {tracks.length === 0 && (
                <tr>
                  <td
                    colSpan={plotPoints.length + 1}
                    className="text-center py-8 text-sm text-muted-foreground"
                  >
                    上のボタンからトラック（行）を追加してください。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ダイアログ */}
      <InputDialog
        open={customTrackDialog.open}
        title="カスタムトラックを追加"
        label="トラック名"
        value={customTrackDialog.name}
        onChange={(v) => setCustomTrackDialog((s) => ({ ...s, name: v }))}
        onConfirm={handleCustomTrackConfirm}
        onClose={() => setCustomTrackDialog(CLOSED_CUSTOM_TRACK)}
        loading={apiLoading === 'add-custom'}
        confirmLabel="追加"
      />
      <ConfirmDeleteDialog
        open={delTrackDialog.open}
        title="トラックを削除"
        description={`トラック「${delTrackDialog.trackName}」を削除しますか？この操作は元に戻せません。`}
        onConfirm={handleDeleteTrackConfirm}
        onClose={() => setDelTrackDialog(CLOSED_DEL_TRACK)}
        loading={apiLoading === `del-${delTrackDialog.trackId}`}
      />
    </div>
  );
}

// ── セルエディタ ─────────────────────────────────────

function TimelineCellEditor({
  value,
  onSave,
}: {
  value: string;
  onSave: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  const handleBlur = () => {
    setEditing(false);
    if (text !== value) {
      onSave(text);
    }
  };

  if (editing) {
    return (
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        autoFocus
        className="w-full h-full min-h-[80px] p-2 text-xs bg-background border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 focus:ring-inset"
        placeholder="内容を入力…"
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full min-h-[80px] p-2 text-xs cursor-pointer hover:bg-muted/30 transition-colors',
        value
          ? 'text-foreground'
          : 'text-muted-foreground/50',
      )}
      onClick={() => {
        setText(value);
        setEditing(true);
      }}
    >
      {value || ''}
    </div>
  );
}
