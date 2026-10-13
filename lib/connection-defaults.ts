import type { TerminalSettings } from '@/types';

export type OracleProtocol = 'TCPS' | 'TCP';

export interface ConnectionBuilderState {
  host: string;
  port: number;
  serviceName: string;
  protocol: OracleProtocol;
}

// Shared defaults (client-safe: no Node imports). lib/session.ts reuses these.
export const DEFAULT_SETTINGS: TerminalSettings = {
  pageSize: 50,
  lineSize: 200,
  autoPingEnabled: true,
  autoPingInterval: 60,
  showLineNumbers: false,
  timestampOutput: false,
};

export interface ConnectionPrefs {
  mode: 'builder' | 'full';
  user: string;
  host: string;
  port: number;
  serviceName: string;
  protocol: OracleProtocol;
  connectString: string;
  walletLocation: string;
  httpsProxy: string;
  httpsProxyPort?: number;
}

// FreeSQL shared values — identical for every user. Only the service name,
// username and password differ per account.
export const DEFAULT_BUILDER: ConnectionBuilderState = {
  host: 'db.freesql.com',
  port: 2484,
  serviceName: '',
  protocol: 'TCPS',
};

export const DEFAULT_USER = '';
export const PREFS_KEY = 'oracle_conn_prefs_v1';

export function buildConnectString(b: ConnectionBuilderState): string {
  const host = b.host.trim() || DEFAULT_BUILDER.host;
  const port = Number.isFinite(b.port) && b.port > 0 ? b.port : DEFAULT_BUILDER.port;
  const service = b.serviceName.trim();
  const base = `${host}:${port}/${service}`;
  // Easy Connect Plus: TCPS needs the scheme prefix for TLS in Thin mode.
  return b.protocol === 'TCPS' ? `tcps://${base}` : base;
}

export const PRESETS: Array<{
  label: string;
  hint: string;
  builder?: ConnectionBuilderState;
  full?: string;
}> = [
  {
    label: 'FreeSQL',
    hint: 'FreeSQL shared host, port and protocol',
    builder: { host: 'db.freesql.com', port: 2484, serviceName: '', protocol: 'TCPS' },
  },
  {
    label: 'XE Local',
    hint: 'Oracle XE default pluggable DB',
    builder: { host: 'localhost', port: 1521, serviceName: 'XEPDB1', protocol: 'TCP' },
  },
  {
    label: 'Free 23ai',
    hint: 'Oracle Database Free default',
    builder: { host: 'localhost', port: 1521, serviceName: 'FREEPDB1', protocol: 'TCP' },
  },
  {
    label: 'ORCL',
    hint: 'Classic ORCLPDB1 install',
    builder: { host: 'localhost', port: 1521, serviceName: 'ORCLPDB1', protocol: 'TCP' },
  },
  {
    label: 'Autonomous',
    hint: 'Paste full ADB string',
    full: ':1522/',
  },
];

export function loadPrefs(): Partial<ConnectionPrefs> {
  try {
    if (typeof document === 'undefined') return {};
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${PREFS_KEY}=`));
    if (!match) return {};
    const parsed = JSON.parse(decodeURIComponent(match.slice(PREFS_KEY.length + 1)));
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

export function savePrefs(prefs: ConnectionPrefs): void {
  try {
    if (typeof document === 'undefined') return;
    // Never persist passwords or wallet passwords. Readable cookie (not
    // httpOnly) so the login form can prefill; 1-year expiry.
    document.cookie =
      `${PREFS_KEY}=${encodeURIComponent(JSON.stringify(prefs))}; ` +
      `path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Storage unavailable — non-fatal.
  }
}
