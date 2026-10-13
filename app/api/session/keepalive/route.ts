import { NextResponse } from 'next/server';
import { getActiveSessionCount, cleanupExpiredSessions } from '@/lib/session';

// Cleanup expired sessions on each keepalive check
cleanupExpiredSessions();

export async function GET() {
  return NextResponse.json({
    active: true,
    sessions: getActiveSessionCount(),
    timestamp: Date.now(),
  });
}