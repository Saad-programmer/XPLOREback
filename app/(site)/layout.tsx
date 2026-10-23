import { SiteShell } from '@/src/shared/site/SiteShell';

/** Website pages (hub, game details, mission map): navbar + shadcn/ui styles. */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return <SiteShell>{children}</SiteShell>;
}
