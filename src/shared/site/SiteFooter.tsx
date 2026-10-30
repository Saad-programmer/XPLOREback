import { cacheLife } from 'next/cache';
import {
  developersFrom,
  FALLBACK_DEVELOPERS,
  REPOSITORY,
  type GitHubContributor,
  type Person,
} from './credits';
import { FooterView } from './FooterView';

async function github<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub ${path}: ${response.status}`);
  return response.json() as Promise<T>;
}

/**
 * The repository is private: listing its contributors needs GITHUB_TOKEN (a
 * read-only token). Without it, or if GitHub fails, the footer shows the
 * fallback developers. Cached for a day, so GitHub is asked rarely.
 */
async function footerData(): Promise<{ developers: Person[]; year: number }> {
  'use cache';
  cacheLife('days');
  // Inside a cached scope: read once per cache period, not on every render.
  const year = new Date().getFullYear();
  try {
    const contributors = await github<GitHubContributor[]>(
      `/repos/${REPOSITORY}/contributors?per_page=30`,
    );
    const names: Record<string, string> = {};
    await Promise.all(
      contributors.map(async ({ login }) => {
        const profile = await github<{ name: string | null }>(`/users/${login}`).catch(() => null);
        if (profile?.name) names[login] = profile.name;
      }),
    );
    const developers = developersFrom(contributors, names);
    return { developers: developers.length ? developers : FALLBACK_DEVELOPERS, year };
  } catch {
    return { developers: FALLBACK_DEVELOPERS, year };
  }
}

/** Footer of the website pages: what Labs is, who founded the club, who built it. */
export async function SiteFooter() {
  const { developers, year } = await footerData();
  return <FooterView developers={developers} year={year} />;
}
