import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'AI Writing Teacher',
  description: '小説・ラノベ初心者向けの創作指導エージェントPoC',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}