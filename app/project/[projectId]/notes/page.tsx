'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';

type Props = { params: Promise<{ projectId: string }> };

export default function NotesPage({ params }: Props) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ projectId: pid }) => setProjectId(pid));
  }, [params]);

  const fetchNotes = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`);
      if (res.ok) {
        const data = (await res.json()) as Note[];
        // AI学習タグのメモだけ表示
        setNotes(data.filter((n) => n.tags.includes('AI学習')));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (noteId: string) => {
    if (!confirm('このメモを削除しますか？')) return;
    setDeletingId(noteId);
    try {
      await fetch(`/api/projects/${projectId}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-base font-semibold">AI学習メモ</h1>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {notes.length} 件
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchNotes} title="再読み込み">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* 説明 */}
      <div className="px-6 py-2.5 border-b border-border/30 bg-muted/20 shrink-0">
        <p className="text-xs text-muted-foreground">
          チャットで AI から得た気づきを「メモに保存」ボタンで記録したものを表示しています。
          次回以降のチャットでエージェントがこのメモを参照し、指導をパーソナライズします。
        </p>
      </div>

      {/* メモ一覧 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && notes.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <p className="text-3xl">📝</p>
              <p className="text-sm font-medium text-muted-foreground">まだメモがありません</p>
              <p className="text-xs text-muted-foreground/70">
                AI チャットの返答にある「メモに保存」ボタンで記録できます
              </p>
            </div>
          )}
          {!loading && notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-lg border border-border/50 bg-background p-4 space-y-2 hover:border-border transition-colors"
            >
              {/* タイトル行 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{note.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(note.updatedAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive',
                    deletingId === note.id && 'opacity-100 cursor-not-allowed',
                  )}
                  title="削除"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* タグ */}
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* 内容プレビュー */}
              {note.content && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed line-clamp-6 border-t border-border/30 pt-2 mt-2">
                  {note.content}
                </pre>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
