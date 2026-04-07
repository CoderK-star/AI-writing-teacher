import { randomUUID } from 'crypto';
import { z } from 'zod';

import { generateTeacherReply } from '@/lib/agent/teacher-agent';
import { getUserId } from '@/lib/auth/user-id';
import { ensureUser, updateSession } from '@/lib/db/session-repository';
import { saveProfile } from '@/lib/memory/store';

const requestSchema = z.object({
  mode: z.enum(['lecture', 'plot', 'revision']),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(6000),
      }),
    )
    .min(1),
  /** サーバー側セッション ID（省略= 永続化しない） */
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const userId = await getUserId();
    const result = await generateTeacherReply({ ...payload, userId });

    // ユーザー識別・永続化（sessionId がある場合のみ）
    if (payload.sessionId) {
      await ensureUser(userId);

      await Promise.all([
        updateSession({
          id: payload.sessionId,
          messages: [
            ...payload.messages,
            { role: 'assistant', content: result.answer },
          ],
          latestResult: result,
        }),
        saveProfile(userId, result.profile),
      ]);
    }

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return Response.json(
      {
        error: 'チャット応答の生成に失敗しました。',
        detail: message,
      },
      { status: 400 },
    );
  }
}