export interface ConnectionConfig {
  user: string;
  password: string;
  connectString: string;
  walletLocation?: string;
  walletPassword?: string;
  httpsProxy?: string;
  httpsProxyPort?: number;
}

export interface SessionData {
  id: string;
  config: ConnectionConfig;
  pool: any; // oracledb Pool
  createdAt: number;
  lastActivity: number;
  settings: TerminalSettings;
}

export interface TerminalSettings {
  pageSize: number;
  lineSize: number;
  autoPingEnabled: boolean;
  autoPingInterval: number; // seconds
  showLineNumbers: boolean;
  timestampOutput: boolean;
}

export interface SQLResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  error?: string;
  isQuery: boolean;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info' | 'result' | 'prompt';
  content: string | SQLResult;
  timestamp: number;
  metadata?: {
    command?: string;
    rowCount?: number;
    executionTime?: number;
  };
}