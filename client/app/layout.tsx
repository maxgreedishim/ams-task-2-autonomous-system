import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'AMS Autonomous Actions', description: 'Управляемые автономные действия' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
