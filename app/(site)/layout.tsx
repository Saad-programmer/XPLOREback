import { SiteFooter } from '@/src/shared/site/SiteFooter';
import { SiteShell } from '@/src/shared/site/SiteShell';

/** Website pages (hub, game details, mission map): navbar, footer, shadcn/ui styles. */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return <SiteShell footer={<SiteFooter />}>{children}</SiteShell>;
}
