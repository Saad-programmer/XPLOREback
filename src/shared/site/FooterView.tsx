'use client';

import { ArrowUp, MessageSquareText } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import logo from '@/public/brand/xplore-labs-logo.svg';
import { useText } from '../i18n/use-text';
import { cn } from '../lib/utils';
import { useReducedMotion } from '../ui/use-reduced-motion';
import { FOUNDER, type Person } from './credits';
import { DevCredit } from './DevCredit';
import { SITE } from './strings';

/** Where "Your feedback" leads (a form or an Xplore page); the button hides without it. */
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL;

/** Round button bottom-right, shown once the page has scrolled. */
function BackToTop() {
  const t = useText();
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // A quarter of a screen down, so it also shows on pages that scroll only a little.
    const onScroll = () => setShown(window.scrollY > Math.min(400, window.innerHeight * 0.25));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })}
      aria-label={t(SITE.backToTop)}
      title={t(SITE.backToTop)}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={cn(
        'fixed right-5 bottom-5 z-30 grid size-12 place-items-center rounded-full border-2 border-ok bg-[#0b1230]/90 text-foreground shadow-[0_8px_24px_-8px_var(--color-ok)] backdrop-blur transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        shown ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}

export function FooterView({ developers, year }: { developers: Person[]; year: number }) {
  const t = useText();

  return (
    <footer className="mt-auto border-t border-border/70 bg-[#050917]/70 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center">
          <Image
            src={logo}
            alt="Xplore Labs"
            className="h-9 w-auto shrink-0 self-start sm:self-auto"
          />
          <p className="text-sm text-muted-foreground">{t(SITE.footerTagline)}</p>
        </div>
        <div className="flex flex-col-reverse gap-6 border-t border-border/60 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground">© {year} Xplore Labs</p>
          <div className="flex flex-wrap items-center gap-4">
            <DevCredit person={FOUNDER} role={t(SITE.foundedBy)} founder />
            {developers.map((developer) => (
              <DevCredit key={developer.login} person={developer} role={t(SITE.developedBy)} />
            ))}
          </div>
        </div>
      </div>

      {FEEDBACK_URL && (
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 left-5 z-30 flex items-center gap-2 rounded-full border border-border bg-[#0b1230]/90 px-4 py-2.5 text-sm font-semibold text-foreground shadow-lg backdrop-blur transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <MessageSquareText className="size-5 text-primary" aria-hidden="true" />
          {t(SITE.feedback)}
        </a>
      )}
      <BackToTop />
    </footer>
  );
}
