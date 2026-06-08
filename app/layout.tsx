import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Live Q&A',
  description: 'Ask and upvote questions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}