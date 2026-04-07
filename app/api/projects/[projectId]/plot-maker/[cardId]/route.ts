import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { updateCard, deleteCard } from '@/lib/db/plot-maker-repository';

type Params = { params: Promise<{ projectId: string; cardId: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).optional(),
  category: z.enum(['event', 'world', 'emotion', 'other']).optional(),
  templateKey: z.string().nullable().optional(),
  columnIndex: z.number().int().min(0).optional(),
  rowIndex: z.number().int().min(0).optional(),
  color: z.string().nullable().optional(),
  linkedCharacterIds: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, cardId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const patch = updateSchema.parse(await request.json());
    return Response.json(await updateCard(cardId, patch));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId, cardId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    await deleteCard(cardId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: '削除に失敗しました。' }, { status: 500 });
  }
}
