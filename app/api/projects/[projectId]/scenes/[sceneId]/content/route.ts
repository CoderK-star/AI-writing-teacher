import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject } from '@/lib/db/project-repository';
import { getScene, updateSceneContent } from '@/lib/db/chapter-repository';

type Params = { params: Promise<{ projectId: string; sceneId: string }> };

const contentSchema = z.object({
  /** Tiptap JSON document (string) */
  content: z.string().min(2),
  wordCount: z.number().int().min(0),
});

/** シーン本文の自動保存専用エンドポイント */
export async function PATCH(request: Request, { params }: Params) {
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
    const { content, wordCount } = contentSchema.parse(await request.json());
    await updateSceneContent(sceneId, content, wordCount);
    return Response.json({ saved: true, wordCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '保存に失敗しました。', detail: message }, { status: 400 });
  }
}
