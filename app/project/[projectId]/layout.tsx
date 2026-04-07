import { ProjectSidebar } from '@/components/project/project-sidebar';

type Props = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex h-screen overflow-hidden">
      <ProjectSidebar projectId={projectId} />
      <div className="flex-1 overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}
