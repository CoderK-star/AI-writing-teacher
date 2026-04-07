import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { updateWorldSetting, deleteWorldSetting } from '@/lib/db/world-repository';

type Params = { params: Promise<{ projectId: string; settingId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['location', 'culture', 'magic-system', 'technology', 'other']).optional(),
  description: z.string().max(3000).optional(),
  notes: z.string().max(3000).nullable().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, settingId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    const patch = updateSchema.parse(await request.json());
    return Response.json(await updateWorldSetting(settingId, patch));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId, settingId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    await deleteWorldSetting(settingId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: '削除に失敗しました。' }, { status: 500 });
  }
}
