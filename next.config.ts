import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // vectra は Node.js 専用(ベクタDB)。クライアントバンドルに含めると
  // @huggingface/transformers が解決できないエラーになるため除外する。
  serverExternalPackages: ['vectra', 'better-sqlite3'],
};

export default nextConfig;