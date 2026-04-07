import { z } from 'zod';
import { getUserId } from '@/lib/auth/user-id';
import { getProject, updateProject, deleteProject } from '@/lib/db/project-repository';
import { listChaptersWithScenes } from '@/lib/db/chapter-repository';
import { listCharacters } from '@/lib/db/character-repository';
import { listWorldSettings } from '@/lib/db/world-repository';
import { listPlotPoints } from '@/lib/db/plot-repository';
import { listNotes } from '@/lib/db/note-repository';

type Params = { params: Promise<{ projectId: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  genre: z.string().max(50).nullable().optional(),
  synopsis: z.string().max(2000).nullable().optional(),
  targetWordCount: z.number().int().positive().nullable().optional(),
  status: z.enum(['draft', 'in-progress', 'complete']).optional(),
  coverColor: z.string().max(20).nullable().optional(),
});

/** プロジェクト詳細（章/キャラ/世界設定/プロット/メモを含む）を取得 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const [chapters, characters, worldSettings, plotPoints, notes] = await Promise.all([
      listChaptersWithScenes(projectId),
      listCharacters(projectId),
      listWorldSettings(projectId),
      listPlotPoints(projectId),
      listNotes(projectId),
    ]);

    const totalWordCount = chapters.reduce(
      (sum, ch) => sum + (ch.scenes ?? []).reduce((s, sc) => s + sc.wordCount, 0),
      0,
    );

    return Response.json({ ...project, chapters, characters, worldSettings, plotPoints, notes, totalWordCount });
  } catch (err) {
    console.error('[GET /api/projects/[projectId]] error:', err);
    return Response.json({ error: 'プロジェクト取得に失敗しました。', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const patch = updateSchema.parse(await request.json());
    const updated = await updateProject(projectId, patch);
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: '更新に失敗しました。', detail: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    const userId = await getUserId();
    const project = await getProject(projectId);
    if (!project || project.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    await deleteProject(projectId);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: '削除に失敗しました。' }, { status: 500 });
  }
}
