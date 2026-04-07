import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import {
  getTimelineMatrix,
  createTrack,
  listTracks,
  reorderTracks,
} from '@/lib/db/timeline-repository';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(await getTimelineMatrix(projectId));
  } catch {
    return Response.json({ error: '取得に失敗しました。' }, { status: 500 });
  }
}

const createTrackSchema = z.object({
  name: z.string().min(1).max(100),
  trackType: z
    .enum(['plot', 'foreshadow', 'resolution', 'character', 'custom'])
    .optional(),
  characterId: z.string().nullable().optional(),
});

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), sortOrder: z.number().int().min(0) })),
});

/** POST — 新規トラック作成 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const body = createTrackSchema.parse(await request.json());
    const tracks = await listTracks(projectId);
    const track = await createTrack({
      id: randomUUID(),
      projectId,
      sortOrder: tracks.length,
      ...body,
    });
    return Response.json(track, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '作成に失敗しました。', detail: message }, { status: 400 });
  }
}

/** PATCH — トラック並べ替え */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId)
      return Response.json({ error: 'Not found' }, { status: 404 });
    const body = reorderSchema.parse(await request.json());
    await reorderTracks(body.items);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: '並べ替えに失敗しました。', detail: message },
      { status: 400 },
    );
  }
}
