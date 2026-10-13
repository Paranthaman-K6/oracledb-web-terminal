import { NextRequest, NextResponse } from 'next/server';
import { pingSchema } from '@/lib/validation';
import { getOracleConnection, getSessionData } from '@/lib/session';
import { resolveSessionId } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = pingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const sessionId = resolveSessionId(validation.data.sessionId);
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated. Please log in.' },
        { status: 401 }
      );
    }
    const session = getSessionData(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    const oracleConn = getOracleConnection(sessionId);
    if (!oracleConn) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const result = await oracleConn.ping();

    return NextResponse.json({
      success: result.success,
      latency: result.latency,
      error: result.success ? undefined : 'Ping failed',
    });
  } catch (error: any) {
    console.error('Ping error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ping failed' },
      { status: 500 }
    );
  }
}