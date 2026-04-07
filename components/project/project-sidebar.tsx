'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutGrid,
  PenLine,
  FolderOpen,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/use-project';

const navItems = [
  { id: 'structure', label: '構成', icon: LayoutGrid },
  { id: 'editor',    label: '執筆', icon: PenLine },
  { id: 'materials', label: '資料', icon: FolderOpen },
  { id: 'notes',     label: 'AIメモ', icon: BookOpen },
] as const;

type Props = { projectId: string };

export function ProjectSidebar({ projectId }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { project } = useProject(projectId);
  const [collapsed, setCollapsed] = useState(false);

  const baseUrl = `/project/${projectId}`;

  return (
    <aside
      className={cn(
        'h-full shrink-0 flex flex-col border-r border-border/60 bg-muted/20 transition-[width] duration-200 overflow-hidden',
        collapsed ? 'w-14' : 'w-44',
      )}
    >
      {/* プロジェクトタイトル */}
      <div
        className={cn(
          'shrink-0 flex items-center gap-2 border-b border-border/40 px-3 py-3 min-w-0',
          collapsed && 'justify-center px-0',
        )}
      >
        <div
          className="h-4 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: project?.coverColor ?? '#6366f1' }}
        />
        {!collapsed && (
          <span className="text-sm font-semibold truncate">
            {project?.title ?? '…'}
          </span>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = pathname.startsWith(`${baseUrl}/${id}`);
          return (
            <button
              key={id}
              onClick={() => router.push(`${baseUrl}/${id}`)}
              title={collapsed ? label : undefined}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left',
                isActive
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="shrink-0 p-2 space-y-0.5 border-t border-border/40">
        <button
          onClick={() => router.push('/dashboard')}
          title={collapsed ? 'ダッシュボード' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!collapsed && 'ダッシュボード'}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              折りたたむ
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
