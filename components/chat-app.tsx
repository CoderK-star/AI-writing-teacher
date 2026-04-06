'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { appConfig } from '@/lib/agent/config';
import { loadSessions, saveSessions } from '@/lib/session-storage';
import type { ChatMessage, ChatSession, GroundedReply, TeachingMode } from '@/lib/types';

const starterMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      'ようこそ。私は創作初心者向けの講師AIです。\n\nいま困っていること、書こうとしているジャンル、見てほしい文章のどれかを送ってください。\n最初は短くても大丈夫です。',
  },
];

const modeOptions: Array<{ value: TeachingMode; label: string; description: string }> = [
  { value: 'lecture', label: '書き方の講師', description: '構成・描写・視点などを教える' },
  { value: 'plot', label: 'プロット相談', description: '物語の骨組みを整理する' },
  { value: 'revision', label: '短文改善', description: '抜粋に対して改善案を出す' },
];

function createSessionTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content.trim();

  if (!firstUserMessage) {
    return '新しい相談';
  }

  return firstUserMessage.slice(0, 28);
}

function createEmptySession(mode: TeachingMode = 'lecture'): ChatSession {
  return {
    id: `session-${crypto.randomUUID()}`,
    title: '新しい相談',
    mode,
    messages: starterMessages,
    latestResult: null,
    updatedAt: new Date().toISOString(),
  };
}

export function ChatApp() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('準備完了');
  const [isLoading, setIsLoading] = useState(false);

  /** サーバーからセッション一覧を取得してローカルにマージする */
  const syncSessionsFromServer = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) return;
      const data = (await response.json()) as { sessions: ChatSession[] };
      if (data.sessions.length > 0) {
        setSessions(data.sessions);
        setActiveSessionId(data.sessions[0].id);
        return true;
      }
    } catch {
      // サーバー未起動など: localStorage フォールバックで続行
    }
    return false;
  }, []);

  useEffect(() => {
    (async () => {
      const fromServer = await syncSessionsFromServer();
      if (fromServer) return;

      const persistedSessions = loadSessions();
      if (persistedSessions.length > 0) {
        setSessions(persistedSessions);
        setActiveSessionId(persistedSessions[0].id);
        return;
      }

      const initialSession = createEmptySession();
      // サーバーにも作成を試みる
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: initialSession.id, title: initialSession.title, mode: initialSession.mode }),
        });
      } catch {
        // ignore
      }
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
    })();
  }, [syncSessionsFromServer]);

  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0] ?? null,
    [activeSessionId, sessions],
  );

  const mode = activeSession?.mode ?? 'lecture';
  const messages = activeSession?.messages ?? starterMessages;
  const latestResult = activeSession?.latestResult ?? null;

  const activeMode = useMemo(() => modeOptions.find((option) => option.value === mode) ?? modeOptions[0], [mode]);

  function updateActiveSession(updater: (session: ChatSession) => ChatSession) {
    setSessions((currentSessions) =>
      currentSessions.map((session) => (session.id === activeSessionId ? updater(session) : session)),
    );
  }

  async function createNewSession() {
    const nextSession = createEmptySession(mode);
    // サーバーにも作成を試みる
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nextSession.id, title: nextSession.title, mode: nextSession.mode }),
      });
    } catch {
      // ignore: localStorage のみで継続
    }
    setSessions((currentSessions) => [nextSession, ...currentSessions]);
    setActiveSessionId(nextSession.id);
    setDraft('');
    setStatus('新しい相談を開始しました');
  }

  async function submitDraft() {
    if (!activeSession || !draft.trim() || isLoading) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: draft.trim() }];
    updateActiveSession((session) => ({
      ...session,
      title: createSessionTitle(nextMessages),
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    }));
    setDraft('');
    setIsLoading(true);
    setStatus('回答を生成しています…');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, messages: nextMessages, sessionId: activeSession.id }),
      });

      const result = (await response.json()) as GroundedReply & { error?: string; detail?: string };

      if (!response.ok || result.error) {
        throw new Error(result.detail ?? result.error ?? 'Unknown error');
      }

      updateActiveSession((session) => ({
        ...session,
        title: createSessionTitle(nextMessages),
        latestResult: result,
        messages: [...nextMessages, { role: 'assistant', content: result.answer }],
        updatedAt: new Date().toISOString(),
      }));
      setStatus(appConfig.provider === 'mock' ? 'モック応答で表示中' : 'AI応答を取得しました');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`エラー: ${detail}`);
      updateActiveSession((session) => ({
        ...session,
        title: createSessionTitle(nextMessages),
        messages: [
          ...nextMessages,
          {
            role: 'assistant',
            content: `応答の生成に失敗しました。\n\n詳細: ${detail}`,
          },
        ],
        updatedAt: new Date().toISOString(),
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function resetConversation() {
    if (!activeSession) {
      return;
    }

    updateActiveSession((session) => ({
      ...session,
      title: '新しい相談',
      messages: starterMessages,
      latestResult: null,
      updatedAt: new Date().toISOString(),
    }));
    setStatus('会話をリセットしました');
    setDraft('');
  }

  async function deleteSession(sessionId: string) {
    // サーバーからも削除を試みる
    try {
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId }),
      });
    } catch {
      // ignore
    }
    setSessions((currentSessions) => {
      const remainingSessions = currentSessions.filter((session) => session.id !== sessionId);

      if (remainingSessions.length === 0) {
        const fallbackSession = createEmptySession();
        setActiveSessionId(fallbackSession.id);
        return [fallbackSession];
      }

      if (activeSessionId === sessionId) {
        setActiveSessionId(remainingSessions[0].id);
      }

      return remainingSessions;
    });
    setStatus('相談履歴を削除しました');
  }

  if (!activeSession) {
    return null;
  }

  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">PoC / Writing Teacher Agent</span>
          <h1>小説初心者に、次の一歩を教えるAI講師。</h1>
          <p>
            書き方の説明、プロット相談、短文改善の3モードを持つ創作教師アプリです。教材参照と学習者プロフィールの雛形を先に入れ、将来のRAG強化とマルチエージェント化に備えた土台から始めます。
          </p>
          <div className="meta">
            <span>対象: {appConfig.targetAudience}</span>
            <span>AI: {appConfig.provider === 'mock' ? 'モック / API未設定' : appConfig.model}</span>
            <span>拡張: RAG・記憶・評価対応</span>
          </div>
        </div>

        <div className="feature-grid">
          {modeOptions.map((option) => (
            <div className="feature-card hero-card" key={option.value}>
              <h3>{option.label}</h3>
              <p>{option.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>講師チャット</h2>
          <p className="caption">
            モード: <strong>{activeMode.label}</strong> — {activeMode.description}
          </p>

          <div className="chat-log">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
              >
                <div className="message-role">{message.role === 'user' ? 'You' : 'Teacher'}</div>
                <pre>{message.content}</pre>
              </article>
            ))}
          </div>

          <div className="composer">
            <div className="composer-row">
              <select
                value={mode}
                onChange={(event) => {
                  const nextMode = event.target.value as TeachingMode;
                  updateActiveSession((session) => ({
                    ...session,
                    mode: nextMode,
                    updatedAt: new Date().toISOString(),
                  }));
                }}
              >
                {modeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="status">{status}</div>
            </div>

            <textarea
              placeholder="悩み、プロット案、見てほしい文章などを入力してください。例: 冒頭が説明っぽくなります。1000字以内の導入をどう直すべきですか？"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />

            <div className="button-row">
              <button className="button button-secondary" onClick={resetConversation} type="button">
                リセット
              </button>
              <button className="button button-primary" onClick={submitDraft} type="button" disabled={isLoading}>
                {isLoading ? '生成中…' : '相談する'}
              </button>
            </div>
          </div>
        </div>

        <aside className="feature-grid">
          <div className="sidebar-card">
            <h3>保存済みセッション</h3>
            <div className="button-row">
              <button className="button button-secondary" onClick={createNewSession} type="button">
                新規相談
              </button>
            </div>
            <div className="list" style={{ marginTop: '14px' }}>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className="badge"
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setStatus('相談履歴を切り替えました');
                  }}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  type="button"
                >
                  <strong>{session.title}</strong>
                  <br />
                  <span className="hint">{new Date(session.updatedAt).toLocaleString('ja-JP')}</span>
                  <br />
                  <span className="hint">{modeOptions.find((option) => option.value === session.mode)?.label}</span>
                  <div style={{ marginTop: '10px' }}>
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteSession(session.id);
                      }}
                      style={{ color: '#fca5a5', fontSize: '12px' }}
                    >
                      削除
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>現在の実装範囲</h3>
            <div className="badge-list">
              <div className="badge">単一エージェント構成</div>
              <div className="badge">教材RAGの雛形</div>
              <div className="badge">学習者プロフィール抽出</div>
              <div className="badge">会話履歴のローカル保存</div>
              <div className="badge">OpenAI接続またはモック応答</div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>直近の取得教材</h3>
            <div className="list">
              {latestResult?.citations?.length ? (
                latestResult.citations.map((citation) => (
                  <div className="list-item" key={citation.id}>
                    <strong>{citation.title}</strong>
                    <br />
                    <span className="hint">{citation.topic}</span>
                  </div>
                ))
              ) : (
                <p className="hint">相談を送ると、参照した教材トピックがここに表示されます。</p>
              )}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>学習者プロフィール</h3>
            {latestResult ? (
              <div className="list">
                <div>
                  <strong>目標</strong>
                  <p className="hint">{latestResult.profile.goals.join(' / ') || '未抽出'}</p>
                </div>
                <div>
                  <strong>繰り返し弱点</strong>
                  <p className="hint">
                    {latestResult.profile.recurringWeaknesses.join(' / ') || '未抽出'}
                  </p>
                </div>
                <div>
                  <strong>直近の推奨課題</strong>
                  <p className="hint">
                    {latestResult.profile.lastSuggestedActions.join(' / ') || '未抽出'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="hint">会話から学習者プロフィールの雛形を自動抽出し、セッションごとに保持します。</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}