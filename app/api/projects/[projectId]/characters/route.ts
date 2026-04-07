import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { listCharacters, createCharacter } from '@/lib/db/character-repository';

type Params = { params: Promise<{ projectId: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(await listCharacters(projectId));
  } catch {
    return Response.json({ error: '取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    const body = createSchema.parse(await request.json());
    const character = await createCharacter({ id: randomUUID(), projectId, ...body });
    return Response.json(character, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '作成に失敗しました。', detail: message }, { status: 400 });
  }
}
