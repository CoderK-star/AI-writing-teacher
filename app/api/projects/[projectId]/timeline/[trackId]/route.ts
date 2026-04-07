import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { updateTrack, deleteTrack } from '@/lib/db/timeline-repository';

type Params = { params: Promise<{ projectId: string; trackId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  trackType: z
    .enum(['plot', 'foreshadow', 'resolution', 'character', 'custom'])
    .optional(),
  characterId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, trackId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const patch = updateSchema.parse(await request.json());
    return Response.json(await updateTrack(trackId, patch));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId, trackId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    await deleteTrack(trackId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: '削除に失敗しました。' }, { status: 500 });
  }
}
