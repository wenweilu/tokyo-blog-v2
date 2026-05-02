import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import QueryProvider from './components/QueryProvider';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Tokyo — Travel Notes',
  description: 'A personal guide to Tokyo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
