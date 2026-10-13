import { OracleConnection } from './oracle';
import type { ConnectionConfig, SessionData } from '@/types';
import { DEFAULT_SETTINGS } from './connection-defaults';
import { v4 as uuidv4 } from 'uuid';

// In-memory session store (use Redis in production)
const sessionStore = new Map<string, SessionData>();

export function createNewSession(config: ConnectionConfig): SessionData {
  const sessionId = uuidv4();

  const session: SessionData = {
    id: sessionId,
    config,
    pool: new OracleConnection(config),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    settings: { ...DEFAULT_SETTINGS },
  };

  sessionStore.set(sessionId, session);
  return session;
}

export function getSessionData(sessionId: string): SessionData | undefined {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
  }
  return session;
}

export function removeSession(sessionId: string): boolean {
  const session = sessionStore.get(sessionId);
  if (session) {
    // Close Oracle connection
    if (session.pool instanceof OracleConnection) {
      session.pool.close().catch(console.error);
    }
    sessionStore.delete(sessionId);
    return true;
  }
  return false;
}

export function getOracleConnection(sessionId: string): OracleConnection | undefined {
  const session = sessionStore.get(sessionId);
  return session?.pool;
}

export function cleanupExpiredSessions(maxAgeMs: number = 3600000): number {
  const now = Date.now();
  let cleaned = 0;
  
  Array.from(sessionStore.entries()).forEach(([id, session]) => {
    if (now - session.lastActivity > maxAgeMs) {
      removeSession(id);
      cleaned++;
    }
  });
  
  return cleaned;
}

export function getActiveSessionCount(): number {
  return sessionStore.size;
}