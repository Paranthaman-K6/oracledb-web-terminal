'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from './Terminal';
import { ConnectionModal } from './ConnectionModal';
import { StatusBar } from './StatusBar';
import { DEFAULT_SETTINGS } from '@/lib/connection-defaults';
import type { ConnectionConfig, SessionData, TerminalSettings } from '@/types';

export function TerminalPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [settings, setSettings] = useState<TerminalSettings>({
    pageSize: 50,
    lineSize: 200,
    autoPingEnabled: true,
    autoPingInterval: 60,
    showLineNumbers: false,
    timestampOutput: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastPing, setLastPing] = useState<number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restore session from the httpOnly cookie after reload; otherwise show login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (!cancelled && response.ok && data.active) {
          const restored: SessionData = {
            id: data.sessionId,
            config: { user: data.user, password: '', connectString: data.connectString },
            pool: null,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
          };
          setSession(restored);
          setSettings(restored.settings);
          setConnectionStatus('connected');
          setShowConnectionModal(false);
          startAutoPing(restored.id, restored.settings.autoPingInterval);
        } else if (!cancelled) {
          setShowConnectionModal(true);
        }
      } catch {
        if (!cancelled) setShowConnectionModal(true);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // startAutoPing is stable; run restore once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle successful connection. The /api/auth/connect route returns only
  // { sessionId }, so build the client-side SessionData here.
  const handleConnect = useCallback(
    ({ sessionId, config }: { sessionId: string; config: ConnectionConfig }) => {
      const newSession: SessionData = {
        id: sessionId,
        config,
        pool: null,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        settings: { ...DEFAULT_SETTINGS },
      };
      setSession(newSession);
      setSettings(newSession.settings);
      setConnectionStatus('connected');
      setShowConnectionModal(false);
      startAutoPing(newSession.id, newSession.settings.autoPingInterval);
    },
    // startAutoPing is stable (useCallback with stable deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Handle disconnection
  const handleDisconnect = useCallback(async () => {
    if (session) {
      stopAutoPing();
      try {
        await fetch('/api/auth/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id }),
        });
      } catch (e) {
        console.error('Disconnect error:', e);
      }
      setSession(null);
      setConnectionStatus('disconnected');
      setShowConnectionModal(true);
    }
  }, [session]);

  // Auto-ping functionality
  const startAutoPing = useCallback((sessionId: string, interval: number) => {
    stopAutoPing();
    if (settings.autoPingEnabled) {
      pingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch('/api/sql/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const data = await response.json();
          if (data.success) {
            setLastPing(data.latency || null);
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('disconnected');
          }
        } catch {
          setConnectionStatus('disconnected');
        }
      }, interval * 1000);
    }
  }, [settings.autoPingEnabled]);

  const stopAutoPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Update auto-ping when settings change
  useEffect(() => {
    if (session && settings.autoPingEnabled) {
      startAutoPing(session.id, settings.autoPingInterval);
    } else {
      stopAutoPing();
    }
    return () => stopAutoPing();
  }, [session, settings.autoPingEnabled, settings.autoPingInterval, startAutoPing, stopAutoPing]);

  // Handle settings update (client-side only; applied to formatting and ping loop)
  const handleSettingsChange = useCallback((newSettings: Partial<TerminalSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoPing();
    };
  }, [stopAutoPing]);

  return (
    <div className="h-screen flex flex-col">
      {/* Status Bar */}
      <StatusBar
        status={connectionStatus}
        session={session}
        lastPing={lastPing}
        autoPingEnabled={settings.autoPingEnabled}
        onDisconnect={handleDisconnect}
        onSettingsChange={handleSettingsChange}
        settings={settings}
      />

      {/* Terminal */}
      <div className="flex-1 overflow-hidden">
        <Terminal
          session={session}
          settings={settings}
          onDisconnect={handleDisconnect}
        />
      </div>

      {/* Connection Modal (hidden while attempting cookie restore) */}
      {!restoring && showConnectionModal && (
        <ConnectionModal
          onConnect={handleConnect}
          onCancel={() => setShowConnectionModal(false)}
        />
      )}
    </div>
  );
}