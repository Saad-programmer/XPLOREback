'use client';

import { Gamepad2, Languages, LogOut, MapIcon, Menu, Settings2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import logo from '@/public/brand/xplore-labs-logo.svg';
import mark from '@/public/brand/xplore-labs-mark.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/shared/components/ui/avatar';
import { Button } from '@/src/shared/components/ui/button';
import { Progress } from '@/src/shared/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/shared/components/ui/dropdown-menu';
import { Separator } from '@/src/shared/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/shared/components/ui/sheet';
import type { Lang } from '../i18n/text';
import { useText } from '../i18n/use-text';
import { cn } from '../lib/utils';
import { getProgressStore, useProgress } from '../progress';
import { levelOf, SITE } from './strings';

const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
];

/** Website links. "Missions" belongs to the Linux game for now (one game is playable). */
function useLinks() {
  const pathname = usePathname();
  return [
    {
      href: '/',
      label: SITE.games,
      icon: Gamepad2,
      active: pathname === '/' || pathname.startsWith('/games'),
    },
    {
      href: '/linux/missions',
      label: SITE.missions,
      icon: MapIcon,
      active: pathname.startsWith('/linux/missions'),
    },
  ];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Avatar, name and XP bar. Points are decided by the server (bridge), shown here only. */
function PlayerCard({ compact = false }: { compact?: boolean }) {
  const t = useText();
  const player = useProgress((s) => s.player);
  const { level, percent, toNext } = levelOf(player?.points ?? 0);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 rounded-md border border-border">
        {player?.avatarUrl && <AvatarImage src={player.avatarUrl} alt="" />}
        <AvatarFallback className="rounded-md bg-secondary font-pixel text-sm text-primary">
          {player ? initials(player.name) : '…'}
        </AvatarFallback>
      </Avatar>
      <div className={cn('min-w-0 text-left', compact && 'hidden lg:block')}>
        <p className="truncate text-sm leading-tight text-foreground">
          {player?.name ?? t(SITE.guest)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-pixel text-xs text-warn">
            {t(SITE.level)} {level}
          </span>
          <Progress
            value={percent}
            className="h-1.5 w-20 bg-secondary *:data-[slot=progress-indicator]:bg-warn"
            aria-label={`${player?.points ?? 0} ${t(SITE.points)}, ${toNext} ${t(SITE.nextLevel)}`}
          />
        </div>
      </div>
    </div>
  );
}

/** Sound, meme sounds, reduced motion and language: the same settings as the games. */
function SettingsItems() {
  const t = useText();
  const settings = useProgress((s) => s.settings);
  const updateSettings = useProgress((s) => s.updateSettings);

  return (
    <>
      <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
        <Settings2 className="size-3.5" aria-hidden="true" />
        {t(SITE.settings)}
      </DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        checked={!settings.muted}
        onCheckedChange={(on) => updateSettings({ muted: !on })}
        onSelect={(event) => event.preventDefault()}
      >
        {t(SITE.sound)}
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={settings.memeSounds}
        onCheckedChange={(on) => updateSettings({ memeSounds: on })}
        onSelect={(event) => event.preventDefault()}
      >
        {t(SITE.memeSounds)}
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={settings.reducedMotion}
        onCheckedChange={(on) => updateSettings({ reducedMotion: on })}
        onSelect={(event) => event.preventDefault()}
      >
        {t(SITE.reducedMotion)}
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
        <Languages className="size-3.5" aria-hidden="true" />
        {t(SITE.language)}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={settings.language}
        onValueChange={(language) => updateSettings({ language: language as Lang })}
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuRadioItem
            key={lang.id}
            value={lang.id}
            onSelect={(event) => event.preventDefault()}
          >
            {lang.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}

function BackToXplore({ className }: { className?: string }) {
  const t = useText();
  return (
    // Xplore is another app on the same domain (Multi-Zones): a plain link.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/" className={className}>
      <LogOut className="size-4" aria-hidden="true" />
      {t(SITE.backToXplore)}
    </a>
  );
}

/** Small screens: links, player and settings in a drawer. */
function MobileMenu() {
  const t = useText();
  const links = useLinks();
  const settings = useProgress((s) => s.settings);
  const updateSettings = useProgress((s) => s.updateSettings);
  const toggles = [
    {
      key: 'sound',
      label: SITE.sound,
      on: !settings.muted,
      set: (on: boolean) => ({ muted: !on }),
    },
    {
      key: 'memes',
      label: SITE.memeSounds,
      on: settings.memeSounds,
      set: (on: boolean) => ({ memeSounds: on }),
    },
    {
      key: 'motion',
      label: SITE.reducedMotion,
      on: settings.reducedMotion,
      set: (on: boolean) => ({ reducedMotion: on }),
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t(SITE.openMenu)}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 border-r border-border bg-card">
        <SheetHeader className="flex-row items-center gap-3 border-b border-border">
          <Image src={mark} alt="" width={32} height={32} />
          <SheetTitle className="font-pixel text-lg">Xplore Labs</SheetTitle>
          <SheetDescription className="sr-only">{t(SITE.menu)}</SheetDescription>
        </SheetHeader>
        <div className="border-b border-border p-4">
          <PlayerCard />
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {links.map((link) => (
            // The navbar stays mounted between pages: close the drawer on navigation.
            <SheetClose key={link.href} asChild>
              <Link
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground',
                  link.active && 'bg-accent text-foreground',
                )}
              >
                <link.icon className="size-4" aria-hidden="true" />
                {t(link.label)}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <Separator />
        <div className="flex flex-col gap-1 p-4 text-sm">
          <p className="mb-1 text-xs text-muted-foreground">{t(SITE.settings)}</p>
          {toggles.map((toggle) => (
            <label key={toggle.key} className="flex items-center justify-between gap-3 py-1.5">
              {t(toggle.label)}
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={toggle.on}
                onChange={(event) => updateSettings(toggle.set(event.target.checked))}
              />
            </label>
          ))}
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label={t(SITE.language)}>
            {LANGUAGES.map((lang) => (
              <Button
                key={lang.id}
                size="sm"
                variant={settings.language === lang.id ? 'secondary' : 'ghost'}
                role="radio"
                aria-checked={settings.language === lang.id}
                onClick={() => updateSettings({ language: lang.id })}
              >
                {lang.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-auto border-t border-border p-4">
          <BackToXplore className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The website navbar (hub, game details, mission map). Game screens have their own bars. */
export function SiteNav() {
  const t = useText();
  const links = useLinks();
  const language = useProgress((s) => s.settings.language);
  const updateSettings = useProgress((s) => s.updateSettings);

  useEffect(() => {
    void getProgressStore()
      .getState()
      .init()
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <MobileMenu />
        <Link href="/" className="flex shrink-0 items-center rounded-md" aria-label={t(SITE.home)}>
          <Image src={logo} alt="Xplore Labs" priority className="h-9 w-auto" />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label={t(SITE.menu)}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                link.active &&
                  'text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:bg-primary',
              )}
            >
              <link.icon className="size-4" aria-hidden="true" />
              {t(link.label)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden font-pixel text-sm sm:inline-flex"
            onClick={() => updateSettings({ language: language === 'fr' ? 'en' : 'fr' })}
            aria-label={t(SITE.switchLanguage)}
            title={t(SITE.switchLanguage)}
          >
            <Languages className="size-4" aria-hidden="true" />
            {language.toUpperCase()}
          </Button>
          <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center rounded-md p-1 pr-2 transition-colors hover:bg-accent data-[state=open]:bg-accent"
                aria-label={t(SITE.profile)}
              >
                <PlayerCard compact />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <SettingsItems />
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <BackToXplore className="cursor-pointer" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
