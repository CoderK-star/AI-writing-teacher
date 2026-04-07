'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Character, CharacterRole } from '@/lib/types';

type Props = {
  projectId: string;
  character: Character;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
};

type FormState = {
  name: string;
  role: CharacterRole;
  gender: string;
  age: string;
  birthday: string;
  height: string;
  weight: string;
  personality: string;
  description: string;
  backstory: string;
  traitsText: string;
  notes: string;
};

function toForm(c: Character): FormState {
  return {
    name: c.name,
    role: c.role,
    gender: c.gender ?? '',
    age: c.age !== null ? String(c.age) : '',
    birthday: c.birthday ?? '',
    height: c.height ?? '',
    weight: c.weight ?? '',
    personality: c.personality ?? '',
    description: c.description ?? '',
    backstory: c.backstory ?? '',
    traitsText: c.traits.join(', '),
    notes: c.notes ?? '',
  };
}

export function CharacterDetailSheet({
  projectId,
  character,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(character));
  const [saving, setSaving] = useState(false);

  // キャラクターが変わったらフォームをリセット
  useEffect(() => {
    setForm(toForm(character));
  }, [character.id]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const traitsArray = form.traitsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const patch = {
        name: form.name.trim() || character.name,
        role: form.role,
        gender: form.gender.trim() || null,
        age: form.age.trim() ? parseInt(form.age) : null,
        birthday: form.birthday.trim() || null,
        height: form.height.trim() || null,
        weight: form.weight.trim() || null,
        personality: form.personality.trim() || null,
        description: form.description.trim() || null,
        backstory: form.backstory.trim() || null,
        traits: traitsArray,
        notes: form.notes.trim() || null,
      };

      const res = await fetch(
        `/api/projects/${projectId}/characters/${character.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        },
      );
      if (!res.ok) throw new Error('更新失敗');
      await onSaved();
    } catch {
      alert('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{form.name || 'キャラクター詳細'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* プロフィール写真（Coming Soon） */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              プロフィール写真
            </Label>
            <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1 text-muted-foreground opacity-40 cursor-not-allowed select-none" title="画像アップロード機能は準備中です">
              <ImageIcon className="w-6 h-6" />
              <span className="text-[10px]">準備中</span>
            </div>
          </div>

          {/* 基本情報 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">基本情報</legend>

            <div>
              <Label htmlFor="char-name" className="text-xs mb-1 block">名前 *</Label>
              <Input id="char-name" value={form.name} onChange={set('name')} placeholder="キャラクター名" />
            </div>

            <div>
              <Label htmlFor="char-role" className="text-xs mb-1 block">役職</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v as CharacterRole }))}
              >
                <SelectTrigger id="char-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="protagonist">主人公</SelectItem>
                  <SelectItem value="antagonist">敵役</SelectItem>
                  <SelectItem value="supporting">脇役</SelectItem>
                  <SelectItem value="minor">モブ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="char-gender" className="text-xs mb-1 block">性別</Label>
                <Input id="char-gender" value={form.gender} onChange={set('gender')} placeholder="例: 男性" />
              </div>
              <div>
                <Label htmlFor="char-age" className="text-xs mb-1 block">年齢</Label>
                <Input id="char-age" type="number" min={0} value={form.age} onChange={set('age')} placeholder="例: 17" />
              </div>
            </div>

            <div>
              <Label htmlFor="char-birthday" className="text-xs mb-1 block">誕生日</Label>
              <Input id="char-birthday" value={form.birthday} onChange={set('birthday')} placeholder="例: 3月15日" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="char-height" className="text-xs mb-1 block">身長</Label>
                <Input id="char-height" value={form.height} onChange={set('height')} placeholder="例: 168cm" />
              </div>
              <div>
                <Label htmlFor="char-weight" className="text-xs mb-1 block">体重</Label>
                <Input id="char-weight" value={form.weight} onChange={set('weight')} placeholder="例: 55kg" />
              </div>
            </div>
          </fieldset>

          {/* 性格・詳細 */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">性格・詳細</legend>

            <div>
              <Label htmlFor="char-personality" className="text-xs mb-1 block">性格</Label>
              <Textarea
                id="char-personality"
                value={form.personality}
                onChange={set('personality')}
                placeholder="キャラクターの性格・気質を記述してください"
                className="resize-none min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="char-description" className="text-xs mb-1 block">説明・外見</Label>
              <Textarea
                id="char-description"
                value={form.description}
                onChange={set('description')}
                placeholder="外見的特徴や簡単な説明"
                className="resize-none min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="char-backstory" className="text-xs mb-1 block">背景・経歴</Label>
              <Textarea
                id="char-backstory"
                value={form.backstory}
                onChange={set('backstory')}
                placeholder="生い立ち・過去の経歴・トラウマなど"
                className="resize-none min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="char-traits" className="text-xs mb-1 block">特徴タグ <span className="text-muted-foreground font-normal">（カンマ区切り）</span></Label>
              <Input
                id="char-traits"
                value={form.traitsText}
                onChange={set('traitsText')}
                placeholder="例: 勇気がある, 短気, 料理が得意"
              />
            </div>

            <div>
              <Label htmlFor="char-notes" className="text-xs mb-1 block">その他・メモ</Label>
              <Textarea
                id="char-notes"
                value={form.notes}
                onChange={set('notes')}
                placeholder="その他の情報・メモ"
                className="resize-none min-h-[60px]"
              />
            </div>
          </fieldset>

          {/* 保存ボタン */}
          <Button
            className="w-full gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存する
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
