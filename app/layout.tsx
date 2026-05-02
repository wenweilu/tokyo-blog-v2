import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';
import QueryProvider from './components/QueryProvider';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: 'Tokyo — Travel Notes',
  description: 'A personal guide to Tokyo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
