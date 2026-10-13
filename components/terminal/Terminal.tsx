'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TerminalOutput } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import { formatWelcomeMessage, formatPrompt, formatHelp, formatSettings } from '@/lib/sql-formatter';
import type { SessionData, TerminalLine, SQLResult, TerminalSettings } from '@/types';

interface TerminalProps {
  session: SessionData | null;
  settings: TerminalSettings;
  onDisconnect: () => void;
}

export function Terminal({ session, settings, onDisconnect }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const lineCounter = useRef(0);

  // Initialize with welcome message
  useEffect(() => {
    if (session && lines.length === 0) {
      addOutputLine('info', formatWelcomeMessage());
      addOutputLine('prompt', formatPrompt());
    }
  }, [session, lines.length]);

  // Scroll to bottom when new lines added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on click
  const handleTerminalClick = useCallback(() => {
    const input = terminalRef.current?.querySelector('input') as HTMLInputElement;
    input?.focus();
  }, []);

  const addOutputLine = useCallback((type: TerminalLine['type'], content: string | SQLResult, metadata?: TerminalLine['metadata']) => {
    const newLine: TerminalLine = {
      id: `line-${++lineCounter.current}`,
      type,
      content,
      timestamp: Date.now(),
      metadata,
    };
    setLines(prev => [...prev, newLine]);
  }, []);

  const handleExecuteCommand = useCallback(async (command: string) => {
    if (!session) return;

    const trimmed = command.trim();
    if (!trimmed) {
      addOutputLine('prompt', formatPrompt());
      return;
    }

    // Add command to history
    setCommandHistory(prev => [...prev.slice(-99), trimmed]);
    setHistoryIndex(-1);
    setLastCommand(trimmed);

    // Handle special commands
    if (trimmed.toUpperCase() === 'EXIT' || trimmed.toUpperCase() === 'QUIT') {
      onDisconnect();
      return;
    }

    if (trimmed.toUpperCase() === 'HELP') {
      addOutputLine('output', formatHelp());
      addOutputLine('prompt', formatPrompt());
      return;
    }

    if (trimmed.toUpperCase() === 'SHOW ALL') {
      addOutputLine('output', formatSettings(settings));
      addOutputLine('prompt', formatPrompt());
      return;
    }

    if (trimmed.toUpperCase().startsWith('SET ')) {
      const result = handleSetCommand(trimmed);
      if (result) {
        addOutputLine('output', result);
      }
      addOutputLine('prompt', formatPrompt());
      return;
    }

    if (trimmed === '/') {
      if (lastCommand) {
        await executeSQL(lastCommand);
      } else {
        addOutputLine('error', 'No previous command to re-execute');
        addOutputLine('prompt', formatPrompt());
      }
      return;
    }

    if (trimmed.startsWith('!!')) {
      addOutputLine('error', 'Shell escape (!!) not supported in web terminal');
      addOutputLine('prompt', formatPrompt());
      return;
    }

    // Execute SQL
    await executeSQL(trimmed);
  }, [session, settings, lastCommand, onDisconnect, addOutputLine]);

  const handleSetCommand = (command: string): string | null => {
    const parts = command.trim().split(/\s+/);
    if (parts.length < 3) return 'Usage: SET <option> <value>';

    const option = parts[1].toUpperCase();
    const value = parts.slice(2).join(' ');

    switch (option) {
      case 'PAGESIZE': {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) return 'Invalid PAGESIZE value';
        return `PAGESIZE set to ${num}`;
      }
      case 'LINESIZE': {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 80) return 'Invalid LINESIZE value (min 80)';
        return `LINESIZE set to ${num}`;
      }
      case 'AUTOPING': {
        if (value.toUpperCase() === 'ON') return 'AUTOPING set to ON';
        if (value.toUpperCase() === 'OFF') return 'AUTOPING set to OFF';
        if (value.toUpperCase().startsWith('INTERVAL')) {
          const interval = parseInt(value.split(/\s+/)[1], 10);
          if (isNaN(interval) || interval < 10) return 'Invalid interval (min 10 seconds)';
          return `AUTOPING INTERVAL set to ${interval}`;
        }
        return 'Usage: SET AUTOPING ON|OFF|INTERVAL <seconds>';
      }
      default:
        return `Unknown SET option: ${option}`;
    }
  };

  const executeSQL = async (sql: string) => {
    if (!session) return;

    try {
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, sql }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        const { result } = data;
        if (result.formattedOutput) {
          addOutputLine('result', result.formattedOutput, {
            command: sql,
            rowCount: result.rowCount,
            executionTime: result.executionTime,
          });
        } else if (result.error) {
          addOutputLine('error', result.error, { command: sql });
        } else {
          addOutputLine('output', 'Statement processed.', { command: sql });
        }
      } else {
        addOutputLine('error', data.error || 'Execution failed', { command: sql });
      }
    } catch (error: any) {
      addOutputLine('error', `Network error: ${error.message}`, { command: sql });
    }

    addOutputLine('prompt', formatPrompt());
  };

  return (
    <div
      ref={terminalRef}
      className="terminal-container h-full flex flex-col"
      onClick={handleTerminalClick}
    >
      <div
        ref={outputRef}
        className="terminal-output flex-1 overflow-y-auto p-4 space-y-1"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {lines.map((line) => (
          <TerminalOutput
            key={line.id}
            line={line}
            settings={settings}
          />
        ))}
      </div>

      {session && (
        <TerminalInput
          onExecute={handleExecuteCommand}
          history={commandHistory}
          historyIndex={historyIndex}
          onHistoryChange={setHistoryIndex}
          placeholder="Enter SQL statement or command..."
        />
      )}
    </div>
  );
}

Terminal.displayName = 'Terminal';