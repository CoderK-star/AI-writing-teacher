import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { listChaptersWithScenes, createChapter } from '@/lib/db/chapter-repository';

type Params = { params: Promise<{ projectId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const chapters = await listChaptersWithScenes(projectId);
    return Response.json(chapters);
  } catch {
    return Response.json({ error: '章の取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const { title } = createSchema.parse(await request.json());
    const chapters = await listChaptersWithScenes(projectId);
    const sortOrder = chapters.length;
    const chapter = await createChapter({ id: randomUUID(), projectId, title, sortOrder });
    return Response.json(chapter, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '章の作成に失敗しました。', detail: message }, { status: 400 });
  }
}
