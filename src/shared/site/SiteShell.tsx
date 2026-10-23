'use client';

import type { ReactNode } from 'react';
import { useProgress } from '../progress';
import { SiteNav } from './SiteNav';
import { Starfield } from './Starfield';

/**
 * Frame of the website pages. The `site` class scopes Tailwind's reset
 * (app/site.css), so the game screens keep their own styles. `isolate` keeps
 * the starfield background behind the page and above the body colour.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const reducedMotion = useProgress((s) => s.settings.reducedMotion);
  return (
    <div
      className="site relative isolate flex min-h-dvh flex-col font-sans text-foreground"
      data-reduced-motion={reducedMotion || undefined}
    >
      <Starfield />
      <SiteNav />
      {children}
    </div>
  );
}
