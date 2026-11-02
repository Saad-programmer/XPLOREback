/**
 * Who made Xplore Labs, for the footer tickets: the club's founder, and the
 * developers, read from the GitHub contributors of this repository so a new
 * contributor appears on their own after their first commit.
 */

export interface Person {
  login: string;
  name: string;
  profileUrl: string;
  avatarUrl: string;
}

export const REPOSITORY = 'Ali-Dev06/Xplore-Labs';

const person = (login: string, name: string): Person => ({
  login,
  name,
  profileUrl: `https://github.com/${login}`,
  avatarUrl: `https://avatars.githubusercontent.com/${login}?size=96`,
});

export const FOUNDER = person('Youssef-YBM', 'Youssef Errami');

/** Shown when GitHub cannot be asked (no token for the private repo, offline, rate limit). */
export const FALLBACK_DEVELOPERS: Person[] = [
  person('Ali-Dev06', 'Ali Zouhdi'),
  person('Saad-programmer', 'Saad Ait Yahia'),
];

/** The fields we use from GitHub's "list repository contributors" answer. */
export interface GitHubContributor {
  login: string;
  type: string;
  contributions: number;
}

/**
 * Developers from the contributors list: people only (no bots), the founder
 * excluded (he has his own ticket), most contributions first. `names` maps a
 * login to the display name of the GitHub profile; the login is used without one.
 */
export function developersFrom(
  contributors: GitHubContributor[],
  names: Record<string, string>,
): Person[] {
  return contributors
    .filter((c) => c.type === 'User' && !c.login.endsWith('[bot]') && c.login !== FOUNDER.login)
    .sort((a, b) => b.contributions - a.contributions)
    .map((c) => person(c.login, names[c.login] || c.login));
}
