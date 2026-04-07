import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { getScene, updateScene, deleteScene } from '@/lib/db/chapter-repository';

type Params = { params: Promise<{ projectId: string; sceneId: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  synopsis: z.string().max(500).nullable().optional(),
  status: z.enum(['draft', 'in-progress', 'complete']).optional(),
  povCharacterId: z.string().uuid().nullable().optional(),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId, sceneId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const scene = await getScene(sceneId);
    if (!scene || scene.projectId !== projectId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return Response.json(scene);
  } catch {
    return Response.json({ error: 'シーン取得に失敗しました。' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, sceneId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const patch = updateSchema.parse(await request.json());
    const updated = await updateScene(sceneId, patch);
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId, sceneId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    await deleteScene(sceneId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: '削除に失敗しました。' }, { status: 500 });
  }
}
