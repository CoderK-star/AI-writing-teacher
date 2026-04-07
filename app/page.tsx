'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4 max-w-xl">
        <div className="eyebrow mx-auto w-fit">✦ AI執筆エディタ</div>
        <h1 className="text-5xl font-bold tracking-tight">Zene</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          作品・章・シーン・キャラクター・世界観・プロットをまとめて管理。<br />
          AIエージェントと並走しながら、物語を書き進めよう。
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" onClick={() => router.push('/dashboard')}>
          作品一覧を開く
        </Button>
        <Button variant="secondary" size="lg" onClick={() => router.push('/chat')}>
          AIチャット（旧UI）
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-4">
        {[
          { icon: '📖', title: '作品管理', desc: '章・シーン・プロットを階層管理' },
          { icon: '🤖', title: 'AI連携', desc: '講義・プロット・添削の3種エージェント' },
          { icon: '🎨', title: 'リッチエディタ', desc: 'Tiptap搭載の執筆専用エディタ' },
        ].map((f) => (
          <div key={f.title} className="feature-card rounded-xl p-4 space-y-2">
            <div className="text-2xl">{f.icon}</div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}