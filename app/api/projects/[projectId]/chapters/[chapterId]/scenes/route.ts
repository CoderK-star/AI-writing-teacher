import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { createScene } from '@/lib/db/chapter-repository';
import { db } from '@/lib/db/client';
import { scenes } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

type Params = { params: Promise<{ projectId: string; chapterId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId, chapterId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const { title } = createSchema.parse(await request.json());
    const existingScenes = db.select().from(scenes).where(eq(scenes.chapterId, chapterId)).orderBy(asc(scenes.sortOrder)).all();
    const sortOrder = existingScenes.length;
    const scene = await createScene({ id: randomUUID(), chapterId, projectId, title, sortOrder });
    return Response.json(scene, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'シーンの作成に失敗しました。', detail: message }, { status: 400 });
  }
}
