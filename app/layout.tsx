import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xplore Labs',
  description: 'Teaching games for the Xplore club platform.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
