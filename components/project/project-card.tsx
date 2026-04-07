'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/lib/types';

const statusLabel: Record<string, string> = {
  draft: '下書き',
  'in-progress': '執筆中',
  complete: '完成',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  'in-progress': 'default',
  complete: 'secondary',
};

const DEFAULT_COLORS = [
  '#38bdf8', '#818cf8', '#34d399', '#fb923c', '#f472b6', '#a78bfa',
];

type Props = {
  project: Project;
  onDeleted?: () => void;
};

export function ProjectCard({ project, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const color = project.coverColor ?? DEFAULT_COLORS[parseInt(project.id.slice(-2), 16) % DEFAULT_COLORS.length];

  const handleDelete = async () => {
    if (!confirm(`「${project.title}」を削除しますか？この操作は取り消せません。`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:bg-card/80 transition-all overflow-hidden">
      {/* カラーバー */}
      <div className="h-1.5 w-full" style={{ background: color }} />

      <div className="p-5 space-y-3">
        {/* ヘッダー行 */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/project/${project.id}/editor`}
            className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors leading-tight"
          >
            <BookOpen className="w-4 h-4 shrink-0" style={{ color }} />
            {project.title}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = `/project/${project.id}/editor`}>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                執筆を開く
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ジャンル + ステータス */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusVariant[project.status]}>{statusLabel[project.status]}</Badge>
          {project.genre && (
            <span className="text-xs text-muted-foreground">{project.genre}</span>
          )}
        </div>

        {/* あらすじ */}
        {project.synopsis && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {project.synopsis}
          </p>
        )}

        {/* 更新日時 */}
        <p className="text-xs text-muted-foreground">
          {new Date(project.updatedAt).toLocaleDateString('ja-JP')} 更新
        </p>
      </div>
    </div>
  );
}
