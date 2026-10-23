import type { Metadata } from 'next';
import { JetBrains_Mono, Pixelify_Sans } from 'next/font/google';
import 'augmented-ui/augmented-ui.min.css';
// site.css first: it declares the order of the CSS layers.
import './site.css';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
/** Placeholder game title font until the club picks one (PRD section 17). */
const display = Pixelify_Sans({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Xplore Labs',
  description: 'Teaching games for the Xplore club platform.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={`${mono.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
