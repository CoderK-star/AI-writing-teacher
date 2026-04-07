import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { updatePlotPoint, deletePlotPoint } from '@/lib/db/plot-repository';

type Params = { params: Promise<{ projectId: string; plotId: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  type: z.enum(['setup', 'conflict', 'climax', 'resolution', 'other']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  linkedCharacterIds: z.array(z.string()).optional(),
  linkedSceneIds: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, plotId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    const patch = updateSchema.parse(await request.json());
    return Response.json(await updatePlotPoint(plotId, patch));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId, plotId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    await deletePlotPoint(plotId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: '削除に失敗しました。' }, { status: 500 });
  }
}
