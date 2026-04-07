'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Focus from '@tiptap/extension-focus';
import { useEffect, useRef, useCallback } from 'react';
import { EditorToolbar } from './editor-toolbar';

type Props = {
  /** Tiptap JSON string — undefined でローディング表示 */
  content: string | undefined;
  onUpdate?: (json: string, wordCount: number) => void;
  placeholder?: string;
  /** 自動保存状態 */
  saveStatus?: 'saved' | 'saving' | 'unsaved';
};

/** テキストノードを再帰的に収集して文字数を数える（和文対応） */
function countChars(json: object): number {
  const str = JSON.stringify(json);
  const matches = str.match(/"text":"((?:[^"\\]|\\.)*)"/g) ?? [];
  return matches
    .map((m) => m.replace(/"text":"/, '').replace(/"$/, '').replace(/\\./g, 'x'))
    .join('').length;
}

export function TiptapEditor({ content, onUpdate, placeholder, saveStatus }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: placeholder ?? 'シーンの本文を書き始めましょう…',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Link.configure({ openOnClick: true }),
      Focus.configure({ className: 'has-focus', mode: 'shallowest' }),
    ],
    content: content ? (JSON.parse(content) as object) : { type: 'doc', content: [] },
    editorProps: {
      attributes: { class: 'tiptap-editor' },
    },
    onUpdate: ({ editor }) => {
      if (!onUpdate) return;
      const json = editor.getJSON();
      const chars = countChars(json);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(JSON.stringify(json), chars);
      }, 1500);
    },
    immediatelyRender: false,
  });

  // content が外部から変わった時（別シーンを選択した時）に内容を差し替え
  const prevContentRef = useRef<string | undefined>(content);
  useEffect(() => {
    if (!editor || content === undefined) return;
    if (content === prevContentRef.current) return;
    prevContentRef.current = content;
    try {
      const parsed = JSON.parse(content) as object;
      editor.commands.setContent(parsed);
    } catch {}
  }, [editor, content]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      <EditorToolbar editor={editor} saveStatus={saveStatus} />
      <div className="flex-1 overflow-auto bg-background text-foreground">
        <EditorContent editor={editor} className="h-full bg-background text-foreground" />
      </div>
    </div>
  );
}
