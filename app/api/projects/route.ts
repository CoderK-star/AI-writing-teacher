import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { ensureUser } from '@/lib/db/session-repository';
import { listProjects, createProject } from '@/lib/db/project-repository';

const createSchema = z.object({
  title: z.string().min(1).max(100),
  genre: z.string().max(50).optional(),
  synopsis: z.string().max(2000).optional(),
  targetWordCount: z.number().int().positive().optional(),
  coverColor: z.string().max(20).optional(),
});

export async function GET() {
  try {
    const userId = await getUserId();
    await ensureUser(userId);
    const projects = await listProjects(userId);
    return Response.json(projects);
  } catch (error) {
    return Response.json({ error: 'プロジェクト一覧の取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    await ensureUser(userId);
    const body = createSchema.parse(await request.json());
    const project = await createProject({ id: randomUUID(), userId, ...body });
    return Response.json(project, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'プロジェクトの作成に失敗しました。', detail: message }, { status: 400 });
  }
}
