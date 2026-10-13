'use client';

import type { TerminalLine, TerminalSettings } from '@/types';

interface TerminalOutputProps {
  line: TerminalLine;
  settings: TerminalSettings;
}

export function TerminalOutput({ line, settings }: TerminalOutputProps) {
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStyle = () => {
    const base = 'font-mono text-terminal whitespace-pre-wrap break-all';
    switch (line.type) {
      case 'input':
        return `${base} text-terminal-prompt`;
      case 'output':
        return `${base} text-terminal-text`;
      case 'error':
        return `${base} text-terminal-error`;
      case 'info':
        return `${base} text-terminal-accent`;
      case 'result':
        return `${base} text-terminal-text`;
      case 'prompt':
        return `${base} text-terminal-prompt`;
      default:
        return base;
    }
  };

  const getPrefix = () => {
    const parts: string[] = [];
    if (settings.timestampOutput) {
      parts.push(`[${formatTimestamp(line.timestamp)}]`);
    }
    if (settings.showLineNumbers && line.metadata?.command) {
      parts.push(`[${line.id}]`);
    }
    return parts.length > 0 ? parts.join(' ') + ' ' : '';
  };

  return (
    <div className={getStyle()}>
      {getPrefix()}
      <span>{typeof line.content === 'string' ? line.content : ''}</span>
    </div>
  );
}