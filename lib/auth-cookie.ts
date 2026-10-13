import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Server-only: uses next/headers. Never import from client components.
export const SESSION_COOKIE = 'oracle_session';
// Matches the 1h in-memory session expiry in lib/session.ts.
export const SESSION_MAX_AGE = 3600;

export function setSessionCookie(res: NextResponse, sessionId: string): void {
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getSessionIdFromCookies(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value || undefined;
}

// Body sessionId wins (backwards compatible); cookie is the fallback that
// enables reload-restore without client-side token storage.
export function resolveSessionId(bodySessionId?: string): string | undefined {
  return bodySessionId || getSessionIdFromCookies();
}
