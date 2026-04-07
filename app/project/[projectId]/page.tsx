'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Users, Globe, GitBranch, FileText, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProject } from '@/hooks/use-project';

const statusLabel: Record<string, string> = {
  draft: '下書き',
  'in-progress': '執筆中',
  complete: '完成',
};

const statusVariant: Record<string, 'secondary' | 'outline' | 'default'> = {
  draft: 'secondary',
  'in-progress': 'outline',
  complete: 'default',
};

const charRoleLabel: Record<string, string> = {
  protagonist: '主人公',
  antagonist: '敵役',
  supporting: '脇役',
  minor: 'モブ',
};

export default function ProjectOverviewPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const { project, isLoading } = useProject(projectId);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">プロジェクトが見つかりません。</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>ダッシュボードへ</Button>
        </div>
      </div>
    );
  }

  const totalChapters = project.chapters.length;
  const totalScenes = project.chapters.reduce((acc, ch) => acc + (ch.scenes?.length ?? 0), 0);

  return (
    <div className="min-h-full bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div
            className="h-5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
          />
          <h1 className="font-semibold text-base truncate flex-1">{project.title}</h1>
          <Badge variant={statusVariant[project.status] ?? 'secondary'}>
            {statusLabel[project.status] ?? project.status}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              作品情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.genre && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">ジャンル</p>
                <p className="text-sm">{project.genre}</p>
              </div>
            )}
            {project.synopsis && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">あらすじ</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.synopsis}</p>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-3 gap-4 text-center">
              <Stat label="合計文字数" value={project.totalWordCount.toLocaleString()} />
              <Stat label="章数" value={totalChapters.toString()} />
              <Stat label="シーン数" value={totalScenes.toString()} />
            </div>
            {project.targetWordCount && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>目標文字数達成率</span>
                  <span>{Math.min(100, Math.round(project.totalWordCount / project.targetWordCount * 100))}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, project.totalWordCount / project.targetWordCount * 100)}%`,
                      backgroundColor: project.coverColor ?? '#6366f1',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  目標: {project.targetWordCount.toLocaleString()} 文字
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* キャラクター */}
        {project.characters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                キャラクター
                <Badge variant="secondary" className="ml-auto">{project.characters.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.characters.map((char) => (
                  <div key={char.id} className="p-3 rounded-lg bg-muted/40 border border-border/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{char.name}</span>
                      <Badge variant="outline" className="text-xs">{charRoleLabel[char.role] ?? char.role}</Badge>
                    </div>
                    {char.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{char.description}</p>
                    )}
                    {char.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {char.traits.slice(0, 5).map((t, i) => (
                          <span key={i} className="text-xs bg-background border border-border/50 rounded px-1.5 py-0.5">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 世界設定 */}
        {project.worldSettings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4" />
                世界設定
                <Badge variant="secondary" className="ml-auto">{project.worldSettings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.worldSettings.map((ws) => (
                  <div key={ws.id} className="p-3 rounded-lg bg-muted/40 border border-border/30">
                    <div className="font-medium text-sm">{ws.name}</div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ws.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* プロットポイント */}
        {project.plotPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                プロット
                <Badge variant="secondary" className="ml-auto">{project.plotPoints.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {project.plotPoints
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((pp, i) => (
                    <li key={pp.id} className="flex gap-3">
                      <span className="text-xs text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium">{pp.title}</p>
                        {pp.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pp.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* メモ */}
        {project.notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                メモ
                <Badge variant="secondary" className="ml-auto">{project.notes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/40 border border-border/30">
                    <p className="font-medium text-sm">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map((t, i) => (
                          <span key={i} className="text-xs bg-background border border-border/50 rounded px-1.5 py-0.5">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 危険ゾーン */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">危険操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">プロジェクトを削除</p>
                <p className="text-xs text-muted-foreground">全てのデータが完全に削除されます。この操作は取り消せません。</p>
              </div>
              <Button
                variant={deleteConfirm ? 'destructive' : 'outline'}
                size="sm"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />削除中…</>
                  : deleteConfirm
                    ? '本当に削除する'
                    : '削除する'}
              </Button>
            </div>
            {deleteConfirm && (
              <p className="text-xs text-destructive mt-2">もう一度ボタンを押すと削除されます。</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
