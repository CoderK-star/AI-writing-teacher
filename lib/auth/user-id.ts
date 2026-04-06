import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const COOKIE_NAME = 'ai-wt-uid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 年

/**
 * Cookie からユーザー ID を取得する。
 * Cookie が存在しない場合は UUID v4 を生成して Set-Cookie ヘッダーに追加する。
 * Next.js App Router の Server Component / Route Handler から使用する。
 */
export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME);

  if (existing?.value) {
    return existing.value;
  }

  const newId = randomUUID();
  cookieStore.set(COOKIE_NAME, newId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return newId;
}
