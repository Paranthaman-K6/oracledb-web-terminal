import { NextRequest, NextResponse } from 'next/server';
import { disconnectSchema } from '@/lib/validation';
import { removeSession } from '@/lib/session';
import { clearSessionCookie, resolveSessionId } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = disconnectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const sessionId = resolveSessionId(validation.data.sessionId);
    if (sessionId) {
      removeSession(sessionId);
    }

    const res = NextResponse.json({
      success: true,
      message: sessionId ? 'Disconnected successfully' : 'No active session',
    });
    clearSessionCookie(res);
    return res;
  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Disconnect failed' },
      { status: 500 }
    );
  }
}
