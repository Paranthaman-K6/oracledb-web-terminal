import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0d1117',
          bgSecondary: '#161b22',
          border: '#30363d',
          text: '#e6edf3',
          textMuted: '#8b949e',
          accent: '#58a6ff',
          success: '#3fb950',
          error: '#f85149',
          warning: '#d29922',
          prompt: '#7ee787',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'terminal': ['14px', { lineHeight: '1.6', letterSpacing: '0.02em' }],
        'terminal-sm': ['12px', { lineHeight: '1.5', letterSpacing: '0.02em' }],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
export default config