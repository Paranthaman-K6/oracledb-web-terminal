import { NextRequest, NextResponse } from 'next/server';
import { connectSchema } from '@/lib/validation';
import { createNewSession } from '@/lib/session';
import { setSessionCookie } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = connectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const config = validation.data;
    const session = createNewSession(config);

    // Test the connection
    const oracleConn = session.pool;
    const pingResult = await oracleConn.ping();

    if (!pingResult.success) {
      // Clean up failed session
      const { removeSession } = await import('@/lib/session');
      removeSession(session.id);
      return NextResponse.json(
        { success: false, error: 'Failed to connect to Oracle database. Please check your credentials.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'Connected to Oracle Database',
      latency: pingResult.latency,
    });
    // Persist session server-side in an httpOnly cookie (1h, matches expiry).
    setSessionCookie(res, session.id);
    return res;
  } catch (error: any) {
    console.error('Connection error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Connection failed' },
      { status: 500 }
    );
  }
}
