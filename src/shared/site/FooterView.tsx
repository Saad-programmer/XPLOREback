'use client';

import { ArrowUp, ArrowUpRight, Code2, Crown, MessageSquareText } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import logo from '@/public/brand/xplore-labs-logo.svg';
import { useText } from '../i18n/use-text';
import type { LocalizedText } from '../i18n/text';
import { cn } from '../lib/utils';
import { useReducedMotion } from '../ui/use-reduced-motion';
import { FOUNDER, type Person } from './credits';
import { SITE } from './strings';

/** Where "Your feedback" leads (a form or an Xplore page); the button hides without it. */
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL;

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** A credit ticket: avatar with a role badge, the role, the name and the GitHub handle. */
function Ticket({
  person,
  role,
  kind,
}: {
  person: Person;
  role: LocalizedText;
  kind: 'founder' | 'developer';
}) {
  const t = useText();
  const founder = kind === 'founder';
  const Badge = founder ? Crown : Code2;

  return (
    <a
      href={person.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t(role)} ${person.name}, ${t(SITE.githubProfile)} ${person.name}`}
      className={cn(
        'group rounded-full p-[1.5px] shadow-[0_10px_30px_-14px_var(--glow)] transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        founder
          ? 'bg-[linear-gradient(120deg,#f5d58a,#e0af68_45%,#a0702a)] [--glow:#e0af68]'
          : 'bg-[linear-gradient(120deg,#7aa2f7,#bb9af7_50%,#f7768e)] [--glow:#bb9af7]',
      )}
    >
      <span className="flex items-center gap-3 rounded-full bg-[#0b1230] py-1.5 pr-4 pl-1.5">
        <span className="relative shrink-0">
          <Image
            src={person.avatarUrl}
            alt=""
            width={48}
            height={48}
            className={cn(
              'size-12 rounded-full border-2 object-cover',
              founder ? 'border-warn/70' : 'border-[#bb9af7]/70',
            )}
          />
          <span
            className={cn(
              'absolute -top-1 -left-1 grid size-5 place-items-center rounded-full border border-[#0b1230]',
              founder ? 'bg-warn text-deep' : 'bg-[#7aa2f7] text-deep',
            )}
            aria-hidden="true"
          >
            <Badge className="size-3" strokeWidth={2.5} />
          </span>
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t(role)}
          </span>
          <span className="truncate font-pixel text-base text-foreground">{person.name}</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <GitHubMark className="size-3" />@{person.login}
          </span>
        </span>
        <ArrowUpRight
          className="ml-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </span>
    </a>
  );
}

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
          <div className="flex flex-wrap gap-4">
            <Ticket person={FOUNDER} role={SITE.foundedBy} kind="founder" />
            {developers.map((developer) => (
              <Ticket
                key={developer.login}
                person={developer}
                role={SITE.developedBy}
                kind="developer"
              />
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
