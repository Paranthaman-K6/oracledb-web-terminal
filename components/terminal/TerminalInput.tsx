'use client';

import { useRef, useEffect, useCallback, useState, KeyboardEvent, ChangeEvent } from 'react';

interface TerminalInputProps {
  onExecute: (command: string) => void;
  history: string[];
  historyIndex: number;
  onHistoryChange: (index: number) => void;
  placeholder: string;
}

export function TerminalInput({ onExecute, history, historyIndex, onHistoryChange, placeholder }: TerminalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [tempInput, setTempInput] = useState('');

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (currentInput.trim()) {
          onExecute(currentInput);
          setCurrentInput('');
          setTempInput('');
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (history.length > 0 && historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          onHistoryChange(newIndex);
          setCurrentInput(history[history.length - 1 - newIndex]);
          setTempInput('');
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          onHistoryChange(newIndex);
          setCurrentInput(history[history.length - 1 - newIndex]);
        } else if (historyIndex === 0) {
          onHistoryChange(-1);
          setCurrentInput(tempInput);
        }
        break;
      case 'Tab':
        // Prevent default tab behavior, could add autocomplete here
        e.preventDefault();
        break;
      default:
        // Save temp input when user starts typing new command
        if (historyIndex >= 0 && !tempInput) {
          setTempInput(currentInput);
        }
    }
  }, [currentInput, history, historyIndex, onExecute, onHistoryChange, tempInput]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
  }, []);

  return (
    <div className="flex items-center px-4 py-2 border-t border-terminal-border bg-terminal-bgSecondary">
      <span className="text-terminal-prompt mr-2 select-none">SQL&gt;</span>
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="terminal-input flex-1 bg-transparent"
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <span className="terminal-cursor cursor-blink text-terminal-prompt ml-1 select-none">█</span>
    </div>
  );
}