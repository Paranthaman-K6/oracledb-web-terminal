import { NextRequest, NextResponse } from 'next/server';
import { executeSchema } from '@/lib/validation';
import { getOracleConnection, getSessionData } from '@/lib/session';
import { resolveSessionId } from '@/lib/auth-cookie';
import { formatSQLResult } from '@/lib/sql-formatter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = executeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
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
    const { sql } = validation.data;
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

    const result = await oracleConn.execute(sql);
    const formattedOutput = formatSQLResult(result, session.settings);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        formattedOutput,
      },
    });
  } catch (error: any) {
    console.error('Execute error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}