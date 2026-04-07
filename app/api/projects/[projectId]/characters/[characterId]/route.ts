import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { updateCharacter, deleteCharacter } from '@/lib/db/character-repository';

type Params = { params: Promise<{ projectId: string; characterId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'minor']).optional(),
  gender: z.string().max(50).nullable().optional(),
  age: z.number().int().min(0).max(9999).nullable().optional(),
  birthday: z.string().max(50).nullable().optional(),
  height: z.string().max(50).nullable().optional(),
  weight: z.string().max(50).nullable().optional(),
  personality: z.string().max(3000).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  backstory: z.string().max(3000).nullable().optional(),
  traits: z.array(z.string().max(50)).optional(),
  notes: z.string().max(3000).nullable().optional(),
  profileImage: z.string().nullable().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId, characterId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    const patch = updateSchema.parse(await request.json());
    const updated = await updateCharacter(characterId, patch);
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId, characterId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) return Response.json({ error: 'Not found' }, { status: 404 });
    await deleteCharacter(characterId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: '削除に失敗しました。' }, { status: 500 });
  }
}
