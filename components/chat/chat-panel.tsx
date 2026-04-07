'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, MessageSquare, Eraser, History, Plus, Trash2, ChevronLeft, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatMessage, TeachingMode, ProjectChatSession } from '@/lib/types';

const modeLabel: Record<TeachingMode, string> = {
  lecture: '講義',
  plot: 'プロット',
  revision: '文章添削',
  character: '登場人物',
};

const modeDesc: Record<TeachingMode, string> = {
  lecture: '小説技法やノウハウを教えてもらう',
  plot: 'プロット・構成のアドバイス',
  revision: '書いた文章を添削・改善提案',
  character: '登場人物の深化・関係性分析',
};

type Props = {
  projectId: string;
  sceneId?: string | null;
};

export function ChatPanel({ projectId, sceneId }: Props) {
  const [mode, setMode] = useState<TeachingMode>('revision');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ProjectChatSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savedNoteIdx, setSavedNoteIdx] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`);
      if (res.ok) {
        const data = (await res.json()) as { sessions: ProjectChatSession[] };
        setSessions(data.sessions);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [projectId]);

  const handleShowHistory = async () => {
    setShowHistory(true);
    await loadHistory();
  };

  const handleSelectSession = (session: ProjectChatSession) => {
    setSessionId(session.id);
    setMode(session.mode);
    setMessages(session.messages);
    setShowHistory(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('このセッションを削除しますか？')) return;
    await fetch(`/api/projects/${projectId}/chat`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id }),
    });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (sessionId === id) {
      setMessages([]);
      setSessionId(null);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          messages: nextMessages,
          sessionId: sessionId ?? undefined,
          sceneId: sceneId ?? undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { answer: string; sessionId: string };
      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠ エラーが発生しました。もう一度お試しください。' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    if (messages.length === 0) return;
    if (!confirm('会話をリセットしますか？')) return;
    setMessages([]);
    setSessionId(null);
  };

  const handleSaveNote = async (content: string, idx: number) => {
    const now = new Date();
    const title = `AIメモ ${now.toLocaleDateString('ja-JP')} ${now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
    try {
      await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags: ['AI学習'] }),
      });
      setSavedNoteIdx(idx);
      setTimeout(() => setSavedNoteIdx(null), 2000);
    } catch {
      // サイレントフォールバック
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (showHistory) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50 shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistory(false)}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground flex-1">会話履歴</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewChat} title="新しい会話">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1.5">
            {historyLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!historyLoading && sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                保存された会話はありません
              </p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectSession(session)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectSession(session)}
                className={cn(
                  'w-full text-left rounded-lg px-3 py-2.5 transition-colors group cursor-pointer',
                  'hover:bg-muted/70 border border-transparent hover:border-border/40',
                  sessionId === session.id && 'bg-primary/10 border-primary/20',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{session.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {modeLabel[session.mode]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{session.messages.length}件</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          AIアシスタント
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleShowHistory} title="会話履歴">
            <History className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear} title="会話をリセット">
            <Eraser className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border/50 shrink-0">
        <div className="flex gap-1">
          {(Object.keys(modeLabel) as TeachingMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 text-xs py-1 rounded-md transition-colors',
                mode === m
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {modeLabel[m]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{modeDesc[mode]}</p>
        {sceneId && (
          <p className="text-xs text-primary/80 mt-1">✦ 現在のシーン内容がコンテキストに含まれます</p>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-6 space-y-2">
              <p className="text-base">🤖</p>
              <p>何でも聞いてください。</p>
              <p className="text-xs opacity-70">Shift+Enterで改行</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg px-3 py-2 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary/15 border border-primary/20 ml-4'
                  : 'bg-muted/60 border border-border/40 mr-4',
              )}
            >
              <div className={cn('text-xs mb-1.5 font-medium flex items-center justify-between', msg.role === 'user' ? 'text-primary' : 'text-muted-foreground')}>
                <span>{msg.role === 'user' ? 'あなた' : `AI (${modeLabel[mode]})`}</span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleSaveNote(msg.content, i)}
                    title="AI学習メモに保存"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-1 py-0.5 rounded"
                  >
                    {savedNoteIdx === i ? (
                      <span className="text-green-500">✓ 保存済み</span>
                    ) : (
                      <><BookmarkPlus className="w-3 h-3" />メモに保存</>
                    )}
                  </button>
                )}
              </div>
              <pre className="whitespace-pre-wrap font-sans break-words">{msg.content}</pre>
            </div>
          ))}
          {loading && (
            <div className="bg-muted/60 border border-border/40 rounded-lg px-3 py-2 mr-4 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">考え中…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-2 space-y-2 shrink-0">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力… (Enter で送信)"
          className="min-h-[72px] max-h-40 resize-none text-sm bg-muted/30 border-border/50"
          disabled={loading}
        />
        <Button className="w-full h-8" size="sm" onClick={handleSubmit} disabled={!input.trim() || loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
          送信
        </Button>
      </div>
    </div>
  );
}
