import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LubayLub.AI - Mental Health Assistant',
  description: 'Your Mental Health Guide - Ask questions about stress management and mental health. LubayLub.AI advocates flexibility and resilience, like a bamboo tree that bends without breaking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
