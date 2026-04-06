import { randomUUID } from 'crypto';
import { z } from 'zod';

import { getUserId } from '@/lib/auth/user-id';
import {
  createSession,
  deleteSession,
  ensureUser,
  listSessions,
} from '@/lib/db/session-repository';

const createSessionSchema = z.object({
  title: z.string().min(1).max(100).default('新しい相談'),
  mode: z.enum(['lecture', 'plot', 'revision']).default('lecture'),
  /** クライアント側で生成した UUID を使いたい場合に指定 */
  id: z.string().uuid().optional(),
});

const deleteSessionSchema = z.object({
  id: z.string().uuid(),
});

/** セッション一覧取得 */
export async function GET() {
  try {
    const userId = await getUserId();
    await ensureUser(userId);
    const sessions = await listSessions(userId);
    return Response.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'セッション一覧の取得に失敗しました。', detail: message }, { status: 500 });
  }
}

/** 新規セッション作成 */
export async function POST(request: Request) {
  try {
    const body = createSessionSchema.parse(await request.json());
    const userId = await getUserId();
    await ensureUser(userId);

    const session = await createSession({
      id: body.id ?? randomUUID(),
      userId,
      title: body.title,
      mode: body.mode,
    });

    return Response.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'セッションの作成に失敗しました。', detail: message }, { status: 400 });
  }
}

/** セッション削除 */
export async function DELETE(request: Request) {
  try {
    const body = deleteSessionSchema.parse(await request.json());
    await deleteSession(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'セッションの削除に失敗しました。', detail: message }, { status: 400 });
  }
}
