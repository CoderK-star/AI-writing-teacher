'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/use-project';
import { CharacterListView } from '@/components/materials/character-list-view';

type MaterialTab = 'characters';

const tabs: { id: MaterialTab; label: string; icon: React.ReactNode }[] = [
  { id: 'characters', label: '登場人物', icon: <Users className="w-4 h-4" /> },
];

export default function MaterialsPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const { project, isLoading } = useProject(projectId);
  const [activeTab, setActiveTab] = useState<MaterialTab>('characters');

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
          <Badge variant="secondary" className="shrink-0">資料</Badge>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左サブサイドバー */}
        <aside className="w-48 shrink-0 border-r border-border/50 bg-muted/30 flex flex-col">
          <div className="px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              資料
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
          {activeTab === 'characters' && (
            <CharacterListView projectId={projectId} />
          )}
        </main>
      </div>
    </div>
  );
}
