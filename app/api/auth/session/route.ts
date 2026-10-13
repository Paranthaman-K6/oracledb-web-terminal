import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import { clearSessionCookie, getSessionIdFromCookies } from '@/lib/auth-cookie';

// Restore a session after page reload from the httpOnly session cookie.
// Never returns secrets (password / wallet password stay server-side).
export async function GET() {
  const sessionId = getSessionIdFromCookies();
  if (!sessionId) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  const session = getSessionData(sessionId);
  if (!session) {
    const res = NextResponse.json({ active: false }, { status: 401 });
    clearSessionCookie(res);
    return res;
  }

  return NextResponse.json({
    active: true,
    sessionId: session.id,
    user: session.config.user,
    connectString: session.config.connectString,
    settings: session.settings,
  });
}
