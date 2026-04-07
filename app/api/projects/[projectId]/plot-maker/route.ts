import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { listCards, createCard, reorderCards } from '@/lib/db/plot-maker-repository';

type Params = { params: Promise<{ projectId: string }> };

const createSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().max(5000).optional(),
  category: z.enum(['event', 'world', 'emotion', 'other']).optional(),
  templateKey: z.string().nullable().optional(),
  columnIndex: z.number().int().min(0).optional(),
  rowIndex: z.number().int().min(0).optional(),
  color: z.string().nullable().optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
      columnIndex: z.number().int().min(0).optional(),
      rowIndex: z.number().int().min(0).optional(),
    }),
  ),
});

export async function GET(req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const url = new URL(req.url);
    const chapterId = url.searchParams.get('chapterId') ?? undefined;
    return Response.json(await listCards(projectId, chapterId));
  } catch {
    return Response.json({ error: '取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const body = createSchema.parse(await request.json());
    const cards = await listCards(projectId, body.chapterId);
    const card = await createCard({
      id: randomUUID(),
      projectId,
      sortOrder: cards.length,
      ...body,
    });
    return Response.json(card, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '作成に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const body = reorderSchema.parse(await request.json());
    await reorderCards(body.items);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '並べ替えに失敗しました。', detail: message }, { status: 400 });
  }
}
