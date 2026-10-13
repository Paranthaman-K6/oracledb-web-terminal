'use client';

import { useState, useRef, useEffect } from 'react';
import { Gear, WifiHigh, WifiNone, Cpu, Database, X } from '@phosphor-icons/react';
import type { SessionData, TerminalSettings } from '@/types';

interface StatusBarProps {
  status: 'connected' | 'disconnected' | 'connecting';
  session: SessionData | null;
  lastPing: number | null;
  autoPingEnabled: boolean;
  onDisconnect: () => void;
  onSettingsChange: (settings: Partial<TerminalSettings>) => void;
  settings: TerminalSettings;
}

export function StatusBar({ 
  status, 
  session, 
  lastPing, 
  autoPingEnabled, 
  onDisconnect, 
  onSettingsChange,
  settings 
}: StatusBarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close settings on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
          setShowSettings(false);
        }
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const statusConfig = {
    connected: { color: 'text-terminal-success', icon: <WifiHigh className="w-4 h-4" />, label: 'CONNECTED' },
    disconnected: { color: 'text-terminal-error', icon: <WifiNone className="w-4 h-4" />, label: 'DISCONNECTED' },
    connecting: { color: 'text-terminal-warning', icon: <Cpu className="w-4 h-4 animate-spin" />, label: 'CONNECTING...' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="border-b border-terminal-border bg-terminal-bgSecondary">
      {/* Main Status Bar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Connection Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 ${currentStatus.color}`}>
            {currentStatus.icon}
            <span className="text-xs font-mono font-medium">{currentStatus.label}</span>
          </div>

          {session && (
            <>
              <div className="w-px h-4 bg-terminal-border" />
              <div className="flex items-center gap-1.5 text-xs text-terminal-textMuted">
                <Database className="w-3.5 h-3.5" />
                <span className="font-mono">{session.config.user}</span>
                <span className="text-terminal-border">@</span>
                <span className="font-mono truncate max-w-[200px]">{session.config.connectString}</span>
              </div>
            </>
          )}

          {lastPing !== null && (
            <>
              <div className="w-px h-4 bg-terminal-border" />
              <div className="flex items-center gap-1 text-xs text-terminal-textMuted">
                <span className="font-mono">{lastPing}ms</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Auto-ping Toggle */}
          <button
            onClick={() => onSettingsChange({ autoPingEnabled: !autoPingEnabled })}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
              autoPingEnabled
                ? 'bg-terminal-success/10 text-terminal-success hover:bg-terminal-success/20'
                : 'bg-terminal-border/20 text-terminal-textMuted hover:bg-terminal-border/30'
            }`}
            title={autoPingEnabled ? 'Disable auto-ping' : 'Enable auto-ping'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoPingEnabled ? 'bg-terminal-success' : 'bg-terminal-border'}`} />
            <span>AUTO-PING</span>
          </button>

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-terminal-textMuted hover:text-terminal-text hover:bg-terminal-border/20 transition-colors"
              title="Settings"
            >
              <Gear className="w-4 h-4" />
            </button>

            {showSettings && (
              <div
                ref={settingsRef}
                className="absolute right-0 top-full mt-1 w-64 bg-terminal-bgSecondary border border-terminal-border rounded-lg shadow-lg py-2 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-2 border-b border-terminal-border">
                  <h3 className="text-xs font-semibold text-terminal-textMuted uppercase tracking-wider">Settings</h3>
                </div>
                
                <div className="py-2 space-y-2">
                  {/* Page Size */}
                  <div className="px-3">
                    <label className="flex items-center justify-between text-sm">
                      <span className="text-terminal-textMuted">Page Size</span>
                      <select
                        value={settings.pageSize}
                        onChange={(e) => onSettingsChange({ pageSize: parseInt(e.target.value, 10) })}
                        className="px-2 py-1 bg-terminal-bg border border-terminal-border rounded text-terminal-text text-xs focus:outline-none focus:ring-1 focus:ring-terminal-accent"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={0}>All</option>
                      </select>
                    </label>
                  </div>

                  {/* Line Size */}
                  <div className="px-3">
                    <label className="flex items-center justify-between text-sm">
                      <span className="text-terminal-textMuted">Line Size</span>
                      <select
                        value={settings.lineSize}
                        onChange={(e) => onSettingsChange({ lineSize: parseInt(e.target.value, 10) })}
                        className="px-2 py-1 bg-terminal-bg border border-terminal-border rounded text-terminal-text text-xs focus:outline-none focus:ring-1 focus:ring-terminal-accent"
                      >
                        <option value={80}>80</option>
                        <option value={120}>120</option>
                        <option value={200}>200</option>
                        <option value={300}>300</option>
                      </select>
                    </label>
                  </div>

                  {/* Auto-ping Interval */}
                  <div className="px-3">
                    <label className="flex items-center justify-between text-sm">
                      <span className="text-terminal-textMuted">Ping Interval</span>
                      <select
                        value={settings.autoPingInterval}
                        onChange={(e) => onSettingsChange({ autoPingInterval: parseInt(e.target.value, 10) })}
                        className="px-2 py-1 bg-terminal-bg border border-terminal-border rounded text-terminal-text text-xs focus:outline-none focus:ring-1 focus:ring-terminal-accent"
                      >
                        <option value={15}>15s</option>
                        <option value={30}>30s</option>
                        <option value={60}>60s</option>
                        <option value={120}>120s</option>
                        <option value={300}>300s</option>
                      </select>
                    </label>
                  </div>

                  <div className="border-t border-terminal-border my-1" />

                  {/* Toggles */}
                  <label className="flex items-center justify-between px-3 text-sm">
                    <span className="text-terminal-textMuted">Show Line Numbers</span>
                    <input
                      type="checkbox"
                      checked={settings.showLineNumbers}
                      onChange={(e) => onSettingsChange({ showLineNumbers: e.target.checked })}
                      className="w-4 h-4 accent-terminal-accent border-terminal-border bg-terminal-bg rounded focus:ring-terminal-accent"
                    />
                  </label>

                  <label className="flex items-center justify-between px-3 text-sm">
                    <span className="text-terminal-textMuted">Timestamp Output</span>
                    <input
                      type="checkbox"
                      checked={settings.timestampOutput}
                      onChange={(e) => onSettingsChange({ timestampOutput: e.target.checked })}
                      className="w-4 h-4 accent-terminal-accent border-terminal-border bg-terminal-bg rounded focus:ring-terminal-accent"
                    />
                  </label>

                  <div className="border-t border-terminal-border my-1" />

                  {/* Disconnect Button */}
                  <button
                    onClick={onDisconnect}
                    className="w-full px-3 py-2 text-left text-sm text-terminal-error hover:bg-terminal-error/10 rounded-none transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop-only footer strip */}
      <div className="hidden md:block px-4 py-1 bg-terminal-bg border-t border-terminal-border">
        <div className="flex items-center justify-between text-xs text-terminal-textMuted">
          <span className="font-mono">Oracle SQLPlus Web Terminal v1.0.0</span>
          <span className="font-mono">Type HELP for commands</span>
        </div>
      </div>
    </div>
  );
}