import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { listNotes, createNote, deleteNote } from '@/lib/db/note-repository';

type Params = { params: Promise<{ projectId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().max(4000).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(await listNotes(projectId));
  } catch {
    return Response.json({ error: '取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    const body = createSchema.parse(await request.json());
    const note = await createNote({
      id: randomUUID(),
      projectId,
      title: body.title,
      content: body.content,
      tags: body.tags,
    });
    return Response.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '作成に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    const { noteId } = (await request.json()) as { noteId: string };
    await deleteNote(noteId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '削除に失敗しました。', detail: message }, { status: 400 });
  }
}
