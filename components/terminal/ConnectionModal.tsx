'use client';

import { useState, useEffect, useRef } from 'react';
import type { ConnectInput } from '@/lib/validation';
import type { ConnectionConfig } from '@/types';
import {
  DEFAULT_BUILDER,
  PRESETS,
  buildConnectString,
  loadPrefs,
  savePrefs,
  type OracleProtocol,
} from '@/lib/connection-defaults';

interface ConnectionModalProps {
  onConnect: (result: { sessionId: string; config: ConnectionConfig }) => void;
  onCancel: () => void;
}

type Mode = 'builder' | 'full';

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2 bg-terminal-bg border rounded-md text-terminal-text placeholder-terminal-textMuted focus:outline-none focus:ring-2 focus:ring-terminal-accent ${
    hasError ? 'border-terminal-error' : 'border-terminal-border'
  }`;

export function ConnectionModal({ onConnect, onCancel }: ConnectionModalProps) {
  const [mode, setMode] = useState<Mode>('builder');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState(DEFAULT_BUILDER.host);
  const [port, setPort] = useState<number>(DEFAULT_BUILDER.port);
  const [serviceName, setServiceName] = useState(DEFAULT_BUILDER.serviceName);
  const [protocol, setProtocol] = useState<OracleProtocol>(DEFAULT_BUILDER.protocol);
  const [connectString, setConnectString] = useState('');
  const [walletLocation, setWalletLocation] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [httpsProxy, setHttpsProxy] = useState('');
  const [httpsProxyPort, setHttpsProxyPort] = useState<string>('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ user?: string; password?: string; connect?: string }>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Prefill shared defaults + last-used prefs (never passwords).
  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs.mode === 'builder' || prefs.mode === 'full') setMode(prefs.mode);
    if (prefs.user) setUser(prefs.user);
    if (prefs.host) setHost(prefs.host);
    if (typeof prefs.port === 'number' && prefs.port > 0) setPort(prefs.port);
    if (prefs.serviceName) setServiceName(prefs.serviceName);
    if (prefs.protocol === 'TCPS' || prefs.protocol === 'TCP') setProtocol(prefs.protocol);
    if (prefs.connectString) setConnectString(prefs.connectString);
    if (prefs.walletLocation) setWalletLocation(prefs.walletLocation);
    if (prefs.httpsProxy) setHttpsProxy(prefs.httpsProxy);
    if (typeof prefs.httpsProxyPort === 'number') setHttpsProxyPort(String(prefs.httpsProxyPort));
    firstInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const effectiveConnectString =
    mode === 'builder' ? buildConnectString({ host, port, serviceName, protocol }) : connectString.trim();

  const applyPreset = (index: number) => {
    const preset = PRESETS[index];
    if (preset.builder) {
      setMode('builder');
      setHost(preset.builder.host);
      setPort(preset.builder.port);
      setServiceName(preset.builder.serviceName);
      setProtocol(preset.builder.protocol);
    } else if (preset.full !== undefined) {
      setMode('full');
      setConnectString(preset.full);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!user.trim()) nextErrors.user = 'Username is required';
    if (!password) nextErrors.password = 'Password is required';
    if (mode === 'builder' && !serviceName.trim()) {
      nextErrors.connect = 'Service name is required (it is unique to your account)';
    } else if (!effectiveConnectString) {
      nextErrors.connect = 'Connection string is required';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: ConnectInput = {
      user: user.trim(),
      password,
      connectString: effectiveConnectString,
      walletLocation: walletLocation || undefined,
      walletPassword: walletPassword || undefined,
      httpsProxy: httpsProxy || undefined,
      httpsProxyPort: httpsProxyPort ? parseInt(httpsProxyPort, 10) : undefined,
    };

    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.sessionId) {
        if (remember) {
          savePrefs({
            mode,
            user: user.trim(),
            host: host.trim() || DEFAULT_BUILDER.host,
            port,
            serviceName: serviceName.trim(),
            protocol,
            connectString: mode === 'full' ? connectString.trim() : '',
            walletLocation,
            httpsProxy,
            httpsProxyPort: httpsProxyPort ? parseInt(httpsProxyPort, 10) : undefined,
          });
        }
        onConnect({
          sessionId: data.sessionId,
          config: {
            user: payload.user,
            password: payload.password,
            connectString: payload.connectString,
            walletLocation: payload.walletLocation,
            walletPassword: payload.walletPassword,
            httpsProxy: payload.httpsProxy,
            httpsProxyPort: payload.httpsProxyPort,
          },
        });
      } else {
        setError(data.error || 'Connection failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-terminal-bgSecondary border border-terminal-border rounded-lg shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-terminal-border flex items-center justify-between">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-terminal-text">
              Oracle Login
            </h2>
            <p className="text-xs text-terminal-textMuted mt-0.5">
              FreeSQL host, port and protocol are prefilled — add your service name and credentials.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-terminal-textMuted hover:text-terminal-text transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Presets */}
          <div>
            <p className="text-xs font-medium text-terminal-textMuted mb-2 uppercase tracking-wider">
              Quick presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset, i) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(i)}
                  title={preset.hint}
                  className="px-2.5 py-1.5 text-xs font-mono rounded border border-terminal-border text-terminal-textMuted hover:text-terminal-text hover:border-terminal-accent transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-md overflow-hidden border border-terminal-border text-sm">
            <button
              type="button"
              onClick={() => setMode('builder')}
              aria-pressed={mode === 'builder'}
              className={`flex-1 py-2 transition-colors ${
                mode === 'builder'
                  ? 'bg-terminal-accent text-terminal-bg font-medium'
                  : 'text-terminal-textMuted hover:text-terminal-text'
              }`}
            >
              Host / Service
            </button>
            <button
              type="button"
              onClick={() => setMode('full')}
              aria-pressed={mode === 'full'}
              className={`flex-1 py-2 transition-colors ${
                mode === 'full'
                  ? 'bg-terminal-accent text-terminal-bg font-medium'
                  : 'text-terminal-textMuted hover:text-terminal-text'
              }`}
            >
              Full string
            </button>
          </div>

          {/* Credentials — always visible */}
          <div className="space-y-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-terminal-text mb-1">
                Username
              </label>
              <input
                ref={firstInputRef}
                id="user"
                name="user"
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className={inputCls(!!errors.user)}
                placeholder="e.g., ADMIN (FreeSQL: your _SCHEMA_ username)"
                disabled={isConnecting}
                autoComplete="username"
              />
              {errors.user && <p className="mt-1 text-sm text-terminal-error">{errors.user}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-terminal-text mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls(!!errors.password)}
                placeholder="••••••••"
                disabled={isConnecting}
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-sm text-terminal-error">{errors.password}</p>}
            </div>
          </div>

          {/* Builder mode */}
          {mode === 'builder' ? (
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-terminal-text mb-1">Protocol</span>
                <div className="flex gap-4" role="radiogroup" aria-label="Protocol">
                  {(['TCPS', 'TCP'] as const).map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-sm text-terminal-text cursor-pointer">
                      <input
                        type="radio"
                        name="protocol"
                        value={p}
                        checked={protocol === p}
                        onChange={() => setProtocol(p)}
                        disabled={isConnecting}
                        className="w-4 h-4 accent-terminal-accent"
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_90px] gap-3">
                <div>
                  <label htmlFor="host" className="block text-sm font-medium text-terminal-text mb-1">
                    Hostname
                  </label>
                  <input
                    id="host"
                    name="host"
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className={inputCls(false)}
                    placeholder="db.freesql.com"
                    disabled={isConnecting}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="port" className="block text-sm font-medium text-terminal-text mb-1">
                    Port
                  </label>
                  <input
                    id="port"
                    name="port"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value, 10) || DEFAULT_BUILDER.port)}
                    className={inputCls(false)}
                    placeholder="2484"
                    disabled={isConnecting}
                    min={1}
                    max={65535}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="serviceName" className="block text-sm font-medium text-terminal-text mb-1">
                  Service Name
                </label>
                <input
                  id="serviceName"
                  name="serviceName"
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className={inputCls(!!errors.connect)}
                  placeholder="e.g., 26ai_un3c1 (unique to your account)"
                  disabled={isConnecting}
                  autoComplete="off"
                />
              </div>
              <div className="font-mono text-xs bg-terminal-bg p-3 rounded border border-terminal-border">
                <span className="text-terminal-textMuted">Connects to: </span>
                <span className="text-terminal-accent">{effectiveConnectString}</span>
              </div>
              {errors.connect && <p className="text-sm text-terminal-error">{errors.connect}</p>}
            </div>
          ) : (
            <div>
              <label htmlFor="connectString" className="block text-sm font-medium text-terminal-text mb-1">
                Connection string
              </label>
              <input
                id="connectString"
                name="connectString"
                type="text"
                value={connectString}
                onChange={(e) => setConnectString(e.target.value)}
                className={inputCls(!!errors.connect)}
                placeholder="host:1521/service or mydb_high.adb.region.oraclecloud.com:1522/mydb.adb.oraclecloud.com"
                disabled={isConnecting}
                autoComplete="off"
              />
              {errors.connect && <p className="mt-1 text-sm text-terminal-error">{errors.connect}</p>}
              <p className="mt-1 text-xs text-terminal-textMuted">
                Format: host:port/service_name, or a TNS alias.
              </p>
            </div>
          )}

          {/* Advanced options */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-terminal-accent hover:text-terminal-accent/80 transition-colors flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-t border-terminal-border pt-4">
              <div>
                <label htmlFor="walletLocation" className="block text-sm font-medium text-terminal-text mb-1">
                  Wallet Location (Optional)
                </label>
                <input
                  id="walletLocation"
                  name="walletLocation"
                  type="text"
                  value={walletLocation}
                  onChange={(e) => setWalletLocation(e.target.value)}
                  className={inputCls(false)}
                  placeholder="./wallet"
                  disabled={isConnecting}
                />
              </div>
              <div>
                <label htmlFor="walletPassword" className="block text-sm font-medium text-terminal-text mb-1">
                  Wallet Password (Optional)
                </label>
                <input
                  id="walletPassword"
                  name="walletPassword"
                  type="password"
                  value={walletPassword}
                  onChange={(e) => setWalletPassword(e.target.value)}
                  className={inputCls(false)}
                  placeholder="Wallet password"
                  disabled={isConnecting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="httpsProxy" className="block text-sm font-medium text-terminal-text mb-1">
                    HTTPS Proxy
                  </label>
                  <input
                    id="httpsProxy"
                    name="httpsProxy"
                    type="text"
                    value={httpsProxy}
                    onChange={(e) => setHttpsProxy(e.target.value)}
                    className={inputCls(false)}
                    placeholder="proxy.example.com"
                    disabled={isConnecting}
                  />
                </div>
                <div>
                  <label htmlFor="httpsProxyPort" className="block text-sm font-medium text-terminal-text mb-1">
                    Proxy Port
                  </label>
                  <input
                    id="httpsProxyPort"
                    name="httpsProxyPort"
                    type="number"
                    value={httpsProxyPort}
                    onChange={(e) => setHttpsProxyPort(e.target.value)}
                    className={inputCls(false)}
                    placeholder="8080"
                    disabled={isConnecting}
                    min={1}
                    max={65535}
                  />
                </div>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-terminal-textMuted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-terminal-accent"
            />
            Remember host and username on this device (never the password)
          </label>

          {error && (
            <div className="p-3 bg-terminal-error/10 border border-terminal-error/30 rounded-md text-terminal-error text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            className="w-full py-2.5 px-4 bg-terminal-accent hover:bg-terminal-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-terminal-bg font-medium rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
