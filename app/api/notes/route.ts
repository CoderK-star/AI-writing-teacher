import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { ensureUser } from '@/lib/db/session-repository';
import { listAiNotes, createAiNote, deleteAiNote } from '@/lib/db/note-repository';

const createSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().max(4000).optional(),
  tags: z.array(z.string()).optional(),
});

/** スタンドアロンチャット用 AI 学習メモ（ai_notes テーブル） */
export async function GET() {
  try {
    const userId = await getUserId();
    await ensureUser(userId);
    const notes = await listAiNotes(userId);
    return Response.json(notes);
  } catch {
    return Response.json({ error: '取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    await ensureUser(userId);
    const body = createSchema.parse(await request.json());
    const note = await createAiNote({
      id: randomUUID(),
      userId,
      title: body.title,
      content: body.content ?? '',
      tags: body.tags ?? ['AI学習'],
    });
    return Response.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '保存に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId();
    await ensureUser(userId);
    const { noteId } = (await request.json()) as { noteId: string };
    await deleteAiNote(noteId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '削除に失敗しました。', detail: message }, { status: 400 });
  }
}
