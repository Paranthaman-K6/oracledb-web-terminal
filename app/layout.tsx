import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Oracle SQLPlus Web Terminal',
  description: 'A serverless web-based SQLPlus terminal for Oracle Database',
  keywords: ['Oracle', 'SQLPlus', 'Database', 'Terminal', 'SQL', 'Vercel'],
  authors: [{ name: 'Oracle CLI WebApp' }],
  openGraph: {
    title: 'Oracle SQLPlus Web Terminal',
    description: 'Interactive SQLPlus-like terminal for Oracle Database in your browser',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-terminal-bg text-terminal-text antialiased">
        {children}
      </body>
    </html>
  );
}