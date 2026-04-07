'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
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
import { usePlotMaker } from '@/hooks/use-structure';
import {
  plotTemplates,
  templatesByGroup,
  templateGroupLabels,
  type PlotTemplate,
} from '@/lib/plot-templates';
import type { Chapter, PlotMakerCard } from '@/lib/types';

type Props = {
  projectId: string;
  chapters: Chapter[];
};

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

const CLOSED_DEL_CARD = { open: false, cardId: '', cardTitle: '' };

const categoryColors: Record<string, string> = {
  event: '#3b82f6',
  world: '#14b8a6',
  emotion: '#f97316',
  other: '#6b7280',
};

const categoryLabels: Record<string, string> = {
  event: 'イベント・世界観',
  world: '世界観',
  emotion: '読者の感情',
  other: 'その他',
};

type TemplateGroup = keyof typeof templatesByGroup;

export function PlotMakerView({ projectId, chapters }: Props) {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    chapters[0]?.id ?? null,
  );
  const { cards, mutate } = usePlotMaker(projectId, activeChapterId ?? undefined);

  // テンプレートパネル state
  const [templateGroup, setTemplateGroup] = useState<TemplateGroup>('foundation');
  const [searchQuery, setSearchQuery] = useState('');
  const [freeText, setFreeText] = useState('');

  // 削除確認ダイアログ状態
  const [delCardDialog, setDelCardDialog] = useState<{ open: boolean; cardId: string; cardTitle: string }>(CLOSED_DEL_CARD);
  const [delLoading, setDelLoading] = useState(false);

  // ── カードの追加 ─────────────────────────────────────

  const addCard = useCallback(
    async (template?: PlotTemplate, customTitle?: string) => {
      if (!activeChapterId) return;
      const title = customTitle ?? template?.label;
      if (!title?.trim()) return;
      await fetch(`/api/projects/${projectId}/plot-maker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: activeChapterId,
          title: title.trim(),
          category: template?.category ?? 'other',
          templateKey: template?.key ?? null,
          color: template?.defaultColor ?? null,
        }),
      });
      mutate();
    },
    [projectId, activeChapterId, mutate],
  );

  const handleFreeTextAdd = () => {
    if (!freeText.trim()) return;
    addCard(undefined, freeText.trim());
    setFreeText('');
  };

  const handleDeleteCard = useCallback(
    (cardId: string, cardTitle: string) =>
      setDelCardDialog({ open: true, cardId, cardTitle }),
    [],
  );

  const handleDeleteCardConfirm = useCallback(async () => {
    setDelLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/plot-maker/${delCardDialog.cardId}`, { method: 'DELETE' });
      setDelCardDialog(CLOSED_DEL_CARD);
      mutate();
    } finally {
      setDelLoading(false);
    }
  }, [delCardDialog.cardId, projectId, mutate]);

  const handleUpdateCard = useCallback(
    async (cardId: string, patch: Partial<PlotMakerCard>) => {
      await fetch(`/api/projects/${projectId}/plot-maker/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      mutate();
    },
    [projectId, mutate],
  );

  // ── テンプレートフィルタ ─────────────────────────────

  const filteredTemplates = searchQuery.trim()
    ? plotTemplates.filter(
        (t) =>
          t.label.includes(searchQuery) || t.description.includes(searchQuery),
      )
    : templatesByGroup[templateGroup];

  // カテゴリ別にカードをグルーピング
  const eventWorldCards = cards.filter(
    (c) => c.category === 'event' || c.category === 'world',
  );
  const emotionCards = cards.filter((c) => c.category === 'emotion');
  const otherCards = cards.filter((c) => c.category === 'other');

  if (!activeChapterId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        章を作成してからプロットメーカーを使用してください。
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 章タブ */}
      <div className="shrink-0 border-b border-border/50 px-4 flex items-center gap-1 overflow-x-auto">
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChapterId(ch.id)}
            className={cn(
              'px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors',
              activeChapterId === ch.id
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {ch.title}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左: テンプレートパネル */}
        <div className="w-72 shrink-0 border-r border-border/50 flex flex-col bg-muted/20">
          {/* 検索 */}
          <div className="p-3 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="要素を検索"
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* グループタブ */}
          {!searchQuery && (
            <div className="px-3 pt-2 flex gap-1 flex-wrap">
              {(Object.keys(templatesByGroup) as TemplateGroup[]).map(
                (group) => (
                  <button
                    key={group}
                    onClick={() => setTemplateGroup(group)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md transition-colors',
                      templateGroup === group
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {templateGroupLabels[group]}
                  </button>
                ),
              )}
            </div>
          )}

          {/* フリーテキスト入力 */}
          <div className="px-3 pt-3 pb-2 border-b border-border/30">
            <p className="text-xs text-muted-foreground mb-1.5">
              物語の構成要素を追加しましょう！
            </p>
            <div className="flex gap-1.5">
              <Input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="フリーテキスト入力"
                className="h-8 text-sm flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleFreeTextAdd()}
              />
              <Button size="sm" className="h-8 px-3" onClick={handleFreeTextAdd}>
                追加
              </Button>
            </div>
          </div>

          {/* テンプレートリスト */}
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {!searchQuery && (
              <p className="text-xs font-medium text-muted-foreground px-1 py-1">
                {templateGroupLabels[templateGroup]}
              </p>
            )}
            {filteredTemplates.map((tmpl) => (
              <button
                key={tmpl.key}
                onClick={() => addCard(tmpl)}
                className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-background border border-transparent hover:border-border/40 transition-colors group"
              >
                <div
                  className="w-5 h-5 rounded-sm flex items-center justify-center shrink-0"
                  style={{ backgroundColor: tmpl.defaultColor + '20' }}
                >
                  <Plus
                    className="w-3 h-3"
                    style={{ color: tmpl.defaultColor }}
                  />
                </div>
                <span className="text-sm text-foreground/80 group-hover:text-foreground truncate">
                  {tmpl.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 右: カードボード */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-4 min-h-full">
            {/* イベント・世界観 列 */}
            <CardColumn
              title="イベント・世界観"
              color="#3b82f6"
              cards={[...eventWorldCards, ...otherCards]}
              onDelete={handleDeleteCard}
              onUpdate={handleUpdateCard}
            />

            {/* 読者の感情 列 */}
            <CardColumn
              title="読者の感情"
              color="#f97316"
              cards={emotionCards}
              onDelete={handleDeleteCard}
              onUpdate={handleUpdateCard}
            />
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <ConfirmDeleteDialog
        open={delCardDialog.open}
        title="カードを削除"
        description={`「${delCardDialog.cardTitle}」を削除しますか？この操作は元に戻せません。`}
        onConfirm={handleDeleteCardConfirm}
        onClose={() => setDelCardDialog(CLOSED_DEL_CARD)}
        loading={delLoading}
      />
    </div>
  );
}

// ── カード列 ─────────────────────────────────────────

function CardColumn({
  title,
  color,
  cards,
  onDelete,
  onUpdate,
}: {
  title: string;
  color: string;
  cards: PlotMakerCard[];
  onDelete: (id: string, title: string) => void;
  onUpdate: (id: string, patch: Partial<PlotMakerCard>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold">{title}</span>
        <Badge variant="secondary" className="text-xs">
          {cards.length}
        </Badge>
      </div>

      {cards.map((card) => (
        <MakerCard
          key={card.id}
          card={card}
          onDelete={() => onDelete(card.id, card.title)}
          onUpdate={(patch) => onUpdate(card.id, patch)}
        />
      ))}

      {cards.length === 0 && (
        <div className="border border-dashed border-border/40 rounded-lg p-6 text-center text-xs text-muted-foreground">
          テンプレートから要素を追加してください
        </div>
      )}
    </div>
  );
}

// ── メーカーカード ───────────────────────────────────

function MakerCard({
  card,
  onDelete,
  onUpdate,
}: {
  card: PlotMakerCard;
  onDelete: () => void;
  onUpdate: (patch: Partial<PlotMakerCard>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(card.content);
  const bgColor = card.color ?? categoryColors[card.category] ?? '#6b7280';

  const handleBlur = () => {
    setEditing(false);
    if (content !== card.content) {
      onUpdate({ content });
    }
  };

  return (
    <div
      className="group rounded-lg border border-border/40 overflow-hidden shadow-sm hover:shadow transition-shadow"
      style={{ borderTopColor: bgColor, borderTopWidth: 3 }}
    >
      <div className="px-3 py-2.5" style={{ backgroundColor: bgColor + '08' }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight flex-1">{card.title}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3 text-muted-foreground" />
          </Button>
        </div>

        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="mt-2 w-full text-xs bg-background/80 border border-border/40 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
            rows={4}
            placeholder="詳細を入力…"
          />
        ) : (
          <p
            className="mt-1.5 text-xs text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setEditing(true)}
          >
            {card.content || 'クリックして内容を入力…'}
          </p>
        )}
      </div>
    </div>
  );
}
