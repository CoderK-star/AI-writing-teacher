'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Highlighter, Undo, Redo, CheckCircle2, Loader2, Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', isActive && 'bg-muted text-primary')}
            onClick={onClick}
            disabled={disabled}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom" className="text-xs">{title}</TooltipContent>
    </Tooltip>
  );
}

const saveStatusConfig = {
  saved: { icon: CheckCircle2, label: '保存済み', className: 'text-emerald-600 dark:text-emerald-400' },
  saving: { icon: Loader2, label: '保存中...', className: 'text-muted-foreground animate-spin' },
  unsaved: { icon: Circle, label: '未保存', className: 'text-amber-600 dark:text-amber-400' },
} as const;

type Props = {
  editor: Editor | null;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
};

export function EditorToolbar({ editor, saveStatus }: Props) {
  if (!editor) return <div className="h-10 border-b border-border/50 bg-background/95" />;

  const SaveIcon = saveStatus ? saveStatusConfig[saveStatus].icon : null;
  const saveLabel = saveStatus ? saveStatusConfig[saveStatus].label : null;
  const saveClass = saveStatus ? saveStatusConfig[saveStatus].className : '';

  return (
    <div className="flex items-center gap-0.5 border-b border-border/50 bg-background/95 px-2 py-1 backdrop-blur-sm flex-wrap">
      {/* 元に戻す / やり直す */}
      <ToolbarButton title="元に戻す (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="やり直す (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* 見出し */}
      <ToolbarButton title="見出し1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="見出し2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* テキスト装飾 */}
      <ToolbarButton title="太字 (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="斜体 (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="下線 (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
        <Underline className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="取り消し線" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="ハイライト" onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')}>
        <Highlighter className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* 配置 */}
      <ToolbarButton title="左揃え" onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}>
        <AlignLeft className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="中央揃え" onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}>
        <AlignCenter className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="右揃え" onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}>
        <AlignRight className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* リスト */}
      <ToolbarButton title="箇条書き" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
        <List className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton title="番号付きリスト" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* 保存ステータス (非表示) */}
      {/* {SaveIcon && (
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <SaveIcon className={cn('w-3.5 h-3.5', saveClass)} />
          <span className={cn('text-xs', saveClass)}>{saveLabel}</span>
        </div>
      )} */}
    </div>
  );
}
