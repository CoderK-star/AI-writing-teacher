import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { ensureUser } from '@/lib/db/session-repository';
import { getProject } from '@/lib/db/project-repository';
import { getScene } from '@/lib/db/chapter-repository';
import { listCharacters } from '@/lib/db/character-repository';
import { generateTeacherReply } from '@/lib/agent/teacher-agent';
import {
  createProjectChatSession,
  updateProjectChatSession,
  getProjectChatSession,
  listProjectChatSessions,
  deleteProjectChatSession,
} from '@/lib/db/project-chat-repository';

type Params = { params: Promise<{ projectId: string }> };

const requestSchema = z.object({
  mode: z.enum(['lecture', 'plot', 'revision', 'character']),
  messages: z.array(
    z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(8000) }),
  ).min(1),
  /** 既存セッション ID（省略時は新規作成） */
  sessionId: z.string().uuid().optional(),
  /** 現在編集中のシーン ID（コンテキスト注入用） */
  sceneId: z.string().uuid().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    await ensureUser(userId);

    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const payload = requestSchema.parse(await request.json());

    // プロジェクトコンテキストを構築して最後のユーザーメッセージに注入
    const contextParts: string[] = [`【作品名】${project.title}`];
    if (project.genre) contextParts.push(`【ジャンル】${project.genre}`);
    if (project.synopsis) contextParts.push(`【あらすじ】${project.synopsis}`);

    if (payload.sceneId) {
      const scene = await getScene(payload.sceneId);
      if (scene) {
        // Tiptap JSONから平文テキストを抽出（簡易実装）
        try {
          const doc = JSON.parse(scene.content) as { content?: Array<{ content?: Array<{ text?: string }> }> };
          const text = doc.content
            ?.flatMap((block) => block.content?.map((n) => n.text ?? '') ?? [])
            .join('')
            .slice(0, 2000);
          if (text) contextParts.push(`【現在編集中のシーン（抜粋）】\n${text}`);
        } catch {}
        if (scene.title) contextParts.push(`【シーンタイトル】${scene.title}`);
      }
    }

    const characters = await listCharacters(projectId);
    if (characters.length > 0) {
      if (payload.mode === 'character') {
        // 登場人物モード時は詳細情報を注入
        const charDetails = characters.map((c) => [
          `▶ ${c.name}（${c.role}）`,
          c.personality ? `  性格: ${c.personality.slice(0, 200)}` : '',
          c.description ? `  詳細: ${c.description.slice(0, 200)}` : '',
          c.backstory ? `  背景: ${c.backstory.slice(0, 200)}` : '',
          c.traits.length > 0 ? `  特徴: ${c.traits.join(', ')}` : '',
          c.notes ? `  メモ: ${c.notes.slice(0, 100)}` : '',
        ].filter(Boolean).join('\n')).join('\n');
        contextParts.push(`【登場人物詳細】\n${charDetails}`);
      } else {
        const charSummary = characters
          .map((c) => `${c.name}（${c.role}）${c.personality ? ': ' + c.personality.slice(0, 80) : c.description ? ': ' + c.description.slice(0, 80) : ''}`)
          .join(', ');
        contextParts.push(`【登場人物】${charSummary}`);
      }
    }

    // コンテキスト付きメッセージ列を生成
    const contextPrefix = contextParts.join('\n');
    const enrichedMessages = payload.messages.map((msg, i) => {
      if (i === payload.messages.length - 1 && msg.role === 'user') {
        return { ...msg, content: `${contextPrefix}\n\n---\n\n${msg.content}` };
      }
      return msg;
    });

    const result = await generateTeacherReply({
      mode: payload.mode,
      messages: enrichedMessages,
      projectId,
      userId,
    });

    // セッション永続化
    const sessionId = payload.sessionId ?? randomUUID();
    const existingSession = payload.sessionId
      ? await getProjectChatSession(payload.sessionId)
      : null;

    if (!existingSession) {
      const firstUserMsg = payload.messages.find((m) => m.role === 'user');
      const title = firstUserMsg?.content.slice(0, 40) ?? 'AIチャット';
      await createProjectChatSession({
        id: sessionId,
        projectId,
        sceneId: payload.sceneId,
        title,
        mode: payload.mode,
      });
    }

    await updateProjectChatSession({
      id: sessionId,
      messages: [...payload.messages, { role: 'assistant', content: result.answer }],
      latestResult: result,
    });

    return Response.json({ ...result, sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: 'AI応答の生成に失敗しました。', detail: message },
      { status: 400 },
    );
  }
}

/** セッション一覧取得 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    await ensureUser(userId);
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const sessions = await listProjectChatSessions(projectId);
    return Response.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'セッション一覧の取得に失敗しました。', detail: message }, { status: 500 });
  }
}

/** セッション削除 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    await ensureUser(userId);
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const { sessionId } = (await request.json()) as { sessionId: string };
    await deleteProjectChatSession(sessionId, projectId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'セッションの削除に失敗しました。', detail: message }, { status: 400 });
  }
}
