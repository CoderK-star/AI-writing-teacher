'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  GitBranch,
  LayoutGrid,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/use-project';
import { PlotView } from '@/components/structure/plot-view';
import { PlotMakerView } from '@/components/structure/plot-maker-view';
import { TimelineView } from '@/components/structure/timeline-view';

type Tab = 'plot' | 'plot-maker' | 'timeline';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'plot', label: 'プロット', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'plot-maker', label: 'プロットメーカー', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'timeline', label: '時系列', icon: <Clock className="w-4 h-4" /> },
];

const statusLabel: Record<string, string> = {
  draft: '下書き',
  'in-progress': '執筆中',
  complete: '完成',
};

export default function StructurePage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const { project, isLoading } = useProject(projectId);
  const [activeTab, setActiveTab] = useState<Tab>('plot');

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
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            ダッシュボードへ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ヘッダー */}
      <header className="shrink-0 bg-background/90 backdrop-blur border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <div
            className="h-5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
          />
          <h1 className="font-semibold text-base truncate">{project.title}</h1>
          <Badge variant="secondary" className="shrink-0">構成</Badge>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー */}
        <aside className="w-48 shrink-0 border-r border-border/50 bg-muted/30 flex flex-col">
          <div className="px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              構成
            </p>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-colors text-left',
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm font-medium'
                      : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* メインエリア */}
        <main className="flex-1 overflow-auto">
          {activeTab === 'plot' && (
            <PlotView projectId={projectId} chapters={project.chapters} />
          )}
          {activeTab === 'plot-maker' && (
            <PlotMakerView projectId={projectId} chapters={project.chapters} />
          )}
          {activeTab === 'timeline' && (
            <TimelineView projectId={projectId} characters={project.characters} />
          )}
        </main>
      </div>
    </div>
  );
}
