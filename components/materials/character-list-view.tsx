'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCharacters } from '@/hooks/use-materials';
import { CharacterDetailSheet } from '@/components/materials/character-detail-view';
import type { Character } from '@/lib/types';

const roleLabel: Record<string, string> = {
  protagonist: '主人公',
  antagonist: '敵役',
  supporting: '脇役',
  minor: 'モブ',
};

const roleColor: Record<string, string> = {
  protagonist: 'bg-primary/15 text-primary border-primary/30',
  antagonist: 'bg-destructive/15 text-destructive border-destructive/30',
  supporting: 'bg-secondary text-secondary-foreground',
  minor: 'bg-muted text-muted-foreground',
};

type Props = { projectId: string };

export function CharacterListView({ projectId }: Props) {
  const { characters, isLoading, mutate } = useCharacters(projectId);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('作成失敗');
      const newChar: Character = await res.json();
      await mutate();
      setNewName('');
      setSelectedCharacter(newChar);
      setSheetOpen(true);
    } catch {
      alert('キャラクターの作成に失敗しました。');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (char: Character) => {
    if (!confirm(`「${char.name}」を削除しますか？この操作は取り消せません。`)) return;
    await fetch(`/api/projects/${projectId}/characters/${char.id}`, { method: 'DELETE' });
    await mutate();
    if (selectedCharacter?.id === char.id) {
      setSheetOpen(false);
      setSelectedCharacter(null);
    }
  };

  const handleOpen = (char: Character) => {
    setSelectedCharacter(char);
    setSheetOpen(true);
  };

  const handleSheetSaved = async () => {
    await mutate();
  };

  return (
    <div className="p-6">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">登場人物</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {characters.length > 0
              ? `${characters.length} 人のキャラクター`
              : 'キャラクターを追加しましょう'}
          </p>
        </div>
      </div>

      {/* 新規作成フォーム */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          placeholder="キャラクター名を入力..."
          className="flex-1 h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          disabled={creating}
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="gap-1.5"
        >
          {creating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          追加
        </Button>
      </div>

      {/* キャラクター一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <div className="text-4xl opacity-20">👤</div>
          <p className="text-sm">まだキャラクターがいません。</p>
          <p className="text-xs opacity-70">上のフォームから追加してください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className="group relative flex flex-col bg-card border border-border/50 rounded-xl p-4 hover:border-border/80 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => handleOpen(char)}
            >
              {/* アバター */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{char.name}</p>
                  <span
                    className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border mt-0.5 ${roleColor[char.role] ?? roleColor.minor}`}
                  >
                    {roleLabel[char.role] ?? char.role}
                  </span>
                </div>
              </div>

              {/* 性格・説明プレビュー */}
              {(char.personality || char.description) && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {char.personality || char.description}
                </p>
              )}

              {/* 特徴タグ */}
              {char.traits.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {char.traits.slice(0, 4).map((t, i) => (
                    <span
                      key={i}
                      className="text-xs bg-muted border border-border/40 rounded px-1.5 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                  {char.traits.length > 4 && (
                    <span className="text-xs text-muted-foreground">+{char.traits.length - 4}</span>
                  )}
                </div>
              )}

              {/* アクションボタン（ホバー時表示） */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); handleOpen(char); }}
                  title="編集"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(char); }}
                  title="削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細シート */}
      {selectedCharacter && (
        <CharacterDetailSheet
          projectId={projectId}
          character={selectedCharacter}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setSelectedCharacter(null);
          }}
          onSaved={handleSheetSaved}
        />
      )}
    </div>
  );
}
