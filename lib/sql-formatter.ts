import type { SQLResult, TerminalSettings } from '@/types';

export function formatSQLResult(result: SQLResult, settings: TerminalSettings): string {
  if (result.error) {
    return formatError(result.error);
  }

  if (!result.isQuery) {
    return formatDMLResult(result);
  }

  if (result.rows.length === 0) {
    return 'no rows selected';
  }

  return formatQueryResult(result, settings);
}

function formatError(error: string): string {
  // Oracle error formatting
  const lines = error.split('\n');
  return lines.map(line => `ERROR: ${line.trim()}`).join('\n');
}

function formatDMLResult(result: SQLResult): string {
  const count = result.rowCount;
  if (count === 1) {
    return '1 row created.';
  } else if (count > 1) {
    return `${count} rows created.`;
  }
  return 'Statement processed.';
}

function formatQueryResult(result: SQLResult, settings: TerminalSettings): string {
  const { columns, rows } = result;
  const pageSize = settings.pageSize || 50;
  const lineSize = settings.lineSize || 200;

  // Calculate column widths
  const colWidths = columns.map((col, i) => {
    const headerWidth = col.length;
    const maxDataWidth = Math.max(
      ...rows.slice(0, pageSize).map(row => String(row[i] || '').length)
    );
    return Math.min(Math.max(headerWidth, maxDataWidth) + 2, 50);
  });

  // Build header
  let output = '';
  
  // Column headers
  const headerLine = columns.map((col, i) => 
    padRight(truncate(col, colWidths[i]), colWidths[i])
  ).join(' ');
  output += headerLine + '\n';

  // Separator
  const separator = columns.map((_, i) => '-'.repeat(colWidths[i])).join(' ');
  output += separator + '\n';

  // Data rows
  const displayRows = rows.slice(0, pageSize);
  for (const row of displayRows) {
    const rowLine = row.map((cell, i) => 
      padRight(truncate(formatCellValue(cell), colWidths[i]), colWidths[i])
    ).join(' ');
    output += rowLine + '\n';
  }

  // Row count footer
  if (rows.length > pageSize) {
    output += `... (showing ${pageSize} of ${rows.length} rows)\n`;
  }
  
  const rowText = result.rowCount === 1 ? 'row' : 'rows';
  output += `${result.rowCount} ${rowText} selected.`;

  return output;
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '(null)';
  }
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString().replace('T', ' ').substring(0, 19);
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function padRight(str: string, length: number): string {
  return str + ' '.repeat(Math.max(0, length - str.length));
}

export function formatPrompt(): string {
  return 'SQL> ';
}

export function formatWelcomeMessage(): string {
  return `Oracle SQLPlus Web Terminal
Version 1.0.0

Type SQL statements or SQLPlus commands.
Type 'help' for available commands.
Type 'exit' or 'quit' to disconnect.
`;
}

export function formatHelp(): string {
  return `Available Commands:
  SELECT, INSERT, UPDATE, DELETE, MERGE    - DML statements
  CREATE, ALTER, DROP, TRUNCATE            - DDL statements
  COMMIT, ROLLBACK, SAVEPOINT              - Transaction control
  DESC[RIBE] <table>                       - Describe table structure
  SET PAGESIZE <n>                         - Set page size (default: 50)
  SET LINESIZE <n>                         - Set line size (default: 200)
  SET AUTOPING ON|OFF                      - Toggle auto-ping
  SET AUTOPING INTERVAL <seconds>          - Set auto-ping interval
  SHOW ALL                                 - Show all settings
  HELP                                     - Show this help
  EXIT | QUIT                              - Disconnect and exit
  /                                        - Re-execute last statement
  @<file>                                  - Execute script (not supported)
  !! <command>                             - Shell escape (not supported)
`;
}

export function formatSettings(settings: TerminalSettings): string {
  return `Current Settings:
  PAGESIZE        ${settings.pageSize}
  LINESIZE        ${settings.lineSize}
  AUTOPING        ${settings.autoPingEnabled ? 'ON' : 'OFF'}
  AUTOPING INTERVAL ${settings.autoPingInterval}s
  SHOW LINE NUMBERS ${settings.showLineNumbers ? 'ON' : 'OFF'}
  TIMESTAMP OUTPUT ${settings.timestampOutput ? 'ON' : 'OFF'}
`;
}