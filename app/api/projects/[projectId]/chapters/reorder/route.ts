import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { reorderChapters } from '@/lib/db/chapter-repository';

type Params = { params: Promise<{ projectId: string }> };

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const { items } = reorderSchema.parse(await request.json());
    await reorderChapters(items);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '並び替えに失敗しました。', detail: message }, { status: 400 });
  }
}
