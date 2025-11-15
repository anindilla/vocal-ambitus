import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vocal Ambitus',
  description:
    'Responsive vocal range assessment that helps singers discover their ambitus.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-slate-950 text-slate-50`}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-sm text-slate-400">
            vibe-coded by{' '}
            <Link
              href="https://anindilla.com"
              className="font-semibold text-emerald-300 transition hover:text-emerald-200"
              target="_blank"
              rel="noreferrer"
            >
              dilleuh
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}

