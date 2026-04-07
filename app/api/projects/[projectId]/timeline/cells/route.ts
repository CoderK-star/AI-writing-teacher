import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { upsertCell } from '@/lib/db/timeline-repository';

type Params = { params: Promise<{ projectId: string }> };

const upsertSchema = z.object({
  trackId: z.string().min(1),
  plotPointId: z.string().min(1),
  content: z.string().max(5000),
});

/** PUT — セルの upsert（content 空なら削除） */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const body = upsertSchema.parse(await request.json());
    const cell = await upsertCell(body.trackId, body.plotPointId, body.content);
    return Response.json(cell ?? { deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}
