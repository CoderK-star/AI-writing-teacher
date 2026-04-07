'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/project/project-card';
import { CreateProjectDialog } from '@/components/project/create-project-dialog';
import type { Project } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export default function DashboardPage() {
  const { data: projects, isLoading, mutate } = useSWR<Project[]>('/api/projects', fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreated = useCallback(() => {
    mutate();
  }, [mutate]);

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="w-5 h-5 text-primary" />
          Zene
        </Link>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新規作品
        </Button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">作品一覧</h1>
          <p className="text-muted-foreground text-sm">
            作品を選んで執筆を続けましょう。
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !Array.isArray(projects) || projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="text-4xl">✦</div>
            <h2 className="text-lg font-semibold">まだ作品がありません</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              「新規作品」ボタンから最初の作品を作りましょう。
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              作品を作る
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onDeleted={() => mutate()} />
            ))}
            <button
              onClick={() => setDialogOpen(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 p-8 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/20 transition-colors cursor-pointer min-h-[160px]"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-medium">新規作品を追加</span>
            </button>
          </div>
        )}
      </main>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
