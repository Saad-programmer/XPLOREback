'use client';

import { ArrowUpRight, CodeXml, Crown } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import type { Person } from './credits';
import styles from './DevCredit.module.css';

const GITHUB_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';

/**
 * Credit ticket ported from the Xplore platform's footer, so both sites share it:
 * spinning gradient ring, floating avatar with a role badge, and a name that
 * rises letter by letter when the ticket scrolls into view.
 */
export function DevCredit({
  person,
  role,
  founder = false,
}: {
  person: Person;
  /** "Founded by" or "Developed by", already translated. */
  role: string;
  founder?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const Badge = founder ? Crown : CodeXml;

  return (
    <a
      ref={ref}
      href={person.profileUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${role} ${person.name} — GitHub`}
      className={cn(styles.credit, 'group')}
      data-founder={founder || undefined}
      data-seen={seen || undefined}
    >
      <span className={styles.inner}>
        <span className={styles.avatar}>
          <span aria-hidden="true" className={styles.badge}>
            <Badge className={founder ? 'size-2.5' : 'size-3'} aria-hidden="true" />
          </span>
          <Image src={person.avatarUrl} alt="" width={48} height={48} />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {role}
          </span>
          <span
            className={cn(
              styles.name,
              'font-semibold text-foreground',
              founder ? 'text-xs' : 'text-base',
            )}
            aria-hidden="true"
          >
            {[...person.name].map((letter, index) => (
              <span key={index} style={{ animationDelay: `${index * 40}ms` }}>
                {letter}
              </span>
            ))}
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors group-hover:text-primary">
            <svg viewBox="0 0 24 24" className={cn(styles.github, 'size-3.5')} aria-hidden="true">
              <path fill="currentColor" d={GITHUB_PATH} />
            </svg>
            @{person.login}
          </span>
        </span>
        <ArrowUpRight
          className="ml-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </span>
    </a>
  );
}
