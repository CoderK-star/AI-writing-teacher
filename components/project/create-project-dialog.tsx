'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

const COVER_COLORS = [
  '#38bdf8', '#818cf8', '#34d399', '#fb923c', '#f472b6', '#a78bfa', '#fbbf24', '#f87171',
];

export function CreateProjectDialog({ open, onOpenChange, onCreated }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          genre: genre.trim() || undefined,
          synopsis: synopsis.trim() || undefined,
          coverColor,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const project = await res.json();
      onOpenChange(false);
      onCreated?.();
      // 作成後にエディタへ遷移
      router.push(`/project/${project.id}/editor`);
    } catch (err) {
      alert('作品の作成に失敗しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setGenre('');
      setSynopsis('');
      setCoverColor(COVER_COLORS[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規作品を作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              placeholder="作品のタイトルを入力"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="genre">ジャンル</Label>
            <Input
              id="genre"
              placeholder="例：ファンタジー、SF、恋愛"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="synopsis">あらすじ</Label>
            <Textarea
              id="synopsis"
              placeholder="作品のあらすじを簡単に..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>カバーカラー</Label>
            <div className="flex gap-2 flex-wrap">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCoverColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: c === coverColor ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? '作成中...' : '作品を作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
