import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { listPlotPoints, createPlotPoint } from '@/lib/db/plot-repository';

type Params = { params: Promise<{ projectId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(['setup', 'conflict', 'climax', 'resolution', 'other']).optional(),
  scope: z.enum(['global', 'chapter']).optional(),
  chapterId: z.string().nullable().optional(),
});

export async function GET(req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') as 'global' | 'chapter' | null;
    const chapterId = url.searchParams.get('chapterId') ?? undefined;
    return Response.json(
      await listPlotPoints(projectId, {
        scope: scope ?? undefined,
        chapterId,
      }),
    );
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
    const plots = await listPlotPoints(projectId, {
      scope: body.scope ?? 'global',
      chapterId: body.chapterId ?? undefined,
    });
    const point = await createPlotPoint({
      id: randomUUID(),
      projectId,
      sortOrder: plots.length,
      title: body.title,
      type: body.type,
      scope: body.scope,
      chapterId: body.chapterId,
    });
    return Response.json(point, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '作成に失敗しました。', detail: message }, { status: 400 });
  }
}
