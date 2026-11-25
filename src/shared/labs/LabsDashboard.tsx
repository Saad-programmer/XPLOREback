'use client';

import {
  ArrowUpRight,
  Award,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Crown,
  Gamepad2,
  LockKeyhole,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { asset } from '../asset';
import { GAMES } from '../games';
import { useText } from '../i18n/use-text';
import { getLabsAuthHeaders } from './auth';
import { DEVELOPMENT_PLAYERS, getSelectedDevelopmentPlayer, PLAYER_CHANGED_EVENT, selectDevelopmentPlayer } from './player';

interface DashboardData {
  playerId: string;
  displayName: string;
  weeklyXp: number;
  weeklyCap: number;
  remainingXp: number;
  capReached: boolean;
  lifetimeLabsXp: number;
  currentWeekStart: string;
  nextResetAt: string;
  completedLevels: number;
  unlockedAchievements: number;
  activePlaytimeSeconds: number;
  gamesPlayed: number;
  personalRecords: number;
  globalRecords: number;
}

interface GameData {
  id: string;
  slug: string;
  title: string;
  levels?: Array<{ id: string }>;
}

interface AchievementDefinition {
  id: string;
  key: string;
  title: string;
  description: string;
  category: string;
  baseXp: number;
  game: { title: string };
}

interface EarnedAchievement {
  achievement: AchievementDefinition;
  earnedAt: string;
}

interface AwardHistoryEntry {
  id: string;
  ruleKey: string;
  requestedXp: number;
  awardedXp: number;
  status: string;
  createdAt: string;
  game: { title: string };
}

interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  weeklyXp: number;
}

interface GameProgress {
  gameId: string;
  completedLevels: number;
}

interface GameScoreEntry {
  playerId: string;
  displayName: string;
  levelId: string;
  levelTitle: string;
  bestScore: number;
  bestTimeSeconds: number;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
}

interface DashboardState {
  summary: DashboardData;
  games: GameData[];
  definitions: AchievementDefinition[];
  earned: EarnedAchievement[];
  history: AwardHistoryEntry[];
  leaderboard: LeaderboardEntry[];
  progress: GameProgress[];
  scoreBoards: Array<{ game: GameData; entries: GameScoreEntry[] }>;
}

const API = (path: string) => asset(`api/v1/labs${path}`);
const DEV_SWITCHER_ENABLED = process.env.NEXT_PUBLIC_LABS_DEV_PLAYER_SWITCHER === 'true';
const copy = {
  profile: { en: 'Player profile', fr: 'Profil du joueur' },
  intro: {
    en: 'Your progress across every game, with Labs rewards kept separate from game scores.',
    fr: 'Ta progression dans tous les jeux, avec les récompenses Labs séparées des scores.',
  },
  development: { en: 'Development player', fr: 'Joueur de développement' },
  loading: { en: 'Loading your player record…', fr: 'Chargement de ton profil…' },
  retry: { en: 'Try again', fr: 'Réessayer' },
  unavailable: {
    en: 'Your player record could not be loaded. Check the local database and try again.',
    fr: 'Ton profil n’a pas pu être chargé. Vérifie la base locale puis réessaie.',
  },
  weekly: { en: 'Weekly XP', fr: 'XP de la semaine' },
  capReached: {
    en: 'Weekly limit reached. Keep playing to improve your records.',
    fr: 'Limite hebdomadaire atteinte. Continue à jouer pour améliorer tes records.',
  },
  remaining: { en: 'XP left this week', fr: 'XP restants cette semaine' },
  resets: { en: 'Resets Monday', fr: 'Réinitialisation lundi' },
  lifetime: { en: 'Lifetime Labs XP', fr: 'XP Labs cumulés' },
  playtime: { en: 'Active playtime', fr: 'Temps de jeu actif' },
  levels: { en: 'Levels completed', fr: 'Niveaux terminés' },
  gamesPlayed: { en: 'Games played', fr: 'Jeux joués' },
  records: { en: 'Personal records', fr: 'Records personnels' },
  recordsSplit: { en: 'Personal / global records', fr: 'Records personnels / mondiaux' },
  achievements: { en: 'Achievements', fr: 'Succès' },
  unlocked: { en: 'Unlocked', fr: 'Débloqué' },
  locked: { en: 'Not yet earned', fr: 'Pas encore obtenu' },
  allGames: { en: 'Your games', fr: 'Tes jeux' },
  play: { en: 'Open game', fr: 'Ouvrir le jeu' },
  leaderboard: { en: 'Weekly leaderboard', fr: 'Classement hebdomadaire' },
  leaderboardNote: {
    en: 'Labs XP ranks are separate from in-game scores.',
    fr: 'Le classement XP Labs est distinct des scores en jeu.',
  },
  rank: { en: 'Rank', fr: 'Rang' },
  player: { en: 'Player', fr: 'Joueur' },
  weeklyScore: { en: 'Weekly XP', fr: 'XP semaine' },
  you: { en: 'You', fr: 'Toi' },
  noLeaderboard: { en: 'No players have earned XP this week yet.', fr: 'Aucun joueur n’a encore gagné d’XP cette semaine.' },
  recentAwards: { en: 'Recent XP awards', fr: 'Dernières récompenses XP' },
  noAwards: { en: 'Your first reward will appear here after you complete a game objective.', fr: 'Ta première récompense apparaîtra ici après un objectif de jeu.' },
  noAchievements: { en: 'Finish a level to start unlocking achievements.', fr: 'Termine un niveau pour commencer à débloquer des succès.' },
  scoreBoards: { en: 'Game score boards', fr: 'Classements des jeux' },
  scoreBoardsNote: {
    en: 'Game scores stay separate from Labs XP. Browser-reported results are not verified.',
    fr: 'Les scores restent séparés de l’XP Labs. Les résultats du navigateur ne sont pas vérifiés.',
  },
  score: { en: 'Score', fr: 'Score' },
  finishTime: { en: 'Time', fr: 'Temps' },
  unverified: { en: 'Unverified', fr: 'Non vérifié' },
  noScores: { en: 'Complete a scored level to appear here.', fr: 'Termine un niveau avec score pour apparaître ici.' },
  dashboardLink: { en: 'Player dashboard', fr: 'Profil du joueur' },
  viewAllGames: { en: 'Browse all games', fr: 'Voir tous les jeux' },
} satisfies Record<string, { en: string; fr: string }>;

async function fetchJson<T>(url: string, playerId: string): Promise<T> {
  const authHeaders = await getLabsAuthHeaders();
  const response = await fetch(url, {
    headers: {
      ...authHeaders,
      ...(process.env.NODE_ENV === 'development' ? { 'x-labs-player': playerId } : {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

function formatPlaytime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function achievementIcon(category: string) {
  if (category === 'RECORD') return Medal;
  if (category === 'ENGAGEMENT') return Sparkles;
  if (category === 'LEVEL_COMPLETION') return Award;
  return CircleHelp;
}

export function LabsDashboard() {
  const t = useText();
  const language = useText()({ en: 'en', fr: 'fr' });
  const [playerId, setPlayerId] = useState<string>(DEVELOPMENT_PLAYERS[0].id);
  const [data, setData] = useState<DashboardState | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async (id: string) => {
    setBusy(true);
    setError(false);
    try {
      const [summary, games, definitions, earned, history, leaderboard] = await Promise.all([
        fetchJson<DashboardData>(API('/xp/summary'), id),
        fetchJson<GameData[]>(API('/games'), id),
        fetchJson<AchievementDefinition[]>(API('/achievements'), id),
        fetchJson<EarnedAchievement[]>(API('/achievements/me'), id),
        fetchJson<AwardHistoryEntry[]>(API('/xp/history'), id),
        fetchJson<LeaderboardEntry[]>(API('/leaderboard'), id),
      ]);
      const progress = await Promise.all(
        games.map((game) => fetchJson<GameProgress>(API(`/games/${game.slug}/progress`), id)),
      );
      const scoreBoards = await Promise.all(
        games.map(async (game) => ({
          game,
          entries: await fetchJson<GameScoreEntry[]>(API(`/leaderboard/${game.slug}`), id),
        })),
      );
      setData({ summary, games, definitions, earned, history, leaderboard, progress, scoreBoards });
    } catch {
      setError(true);
      setData(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const updatePlayer = (id: string = getSelectedDevelopmentPlayer()) => {
      setPlayerId(id);
      void load(id);
    };
    updatePlayer();
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      updatePlayer(detail);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'labs:development-player') updatePlayer();
    };
    window.addEventListener(PLAYER_CHANGED_EVENT, onChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PLAYER_CHANGED_EVENT, onChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [load]);

  const earnedIds = useMemo(() => new Set(data?.earned.map((entry) => entry.achievement.id)), [data]);
  const weeklyXp = data?.summary.weeklyXp ?? 0;
  const weeklyCap = data?.summary.weeklyCap ?? 50;
  const percent = weeklyCap > 0 ? Math.min(100, (weeklyXp / weeklyCap) * 100) : 0;
  const currentRank = data?.leaderboard.findIndex((entry) => entry.playerId === playerId) ?? -1;
  const selectedPlayer = DEVELOPMENT_PLAYERS.find((player) => player.id === playerId) ?? DEVELOPMENT_PLAYERS[0];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center border border-primary/50 bg-primary/10 font-pixel text-xl text-primary">
            {selectedPlayer.displayName.slice(0, 1)}
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">{t(copy.profile)}</p>
            <h1 className="font-pixel text-3xl leading-tight text-foreground sm:text-4xl">
              {data?.summary.displayName ?? selectedPlayer.displayName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t(copy.intro)}</p>
          </div>
        </div>
        {DEV_SWITCHER_ENABLED && (
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            {t(copy.development)}
            <select
              aria-label={t(copy.development)}
              className="min-w-44 border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={playerId}
              onChange={(event) => selectDevelopmentPlayer(event.target.value)}
            >
              {DEVELOPMENT_PLAYERS.map((player) => (
                <option key={player.id} value={player.id}>{player.displayName}</option>
              ))}
            </select>
          </label>
        )}
      </header>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 border border-danger/50 bg-danger/10 p-5 text-sm text-foreground">
          <p>{t(copy.unavailable)}</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-border px-3 py-2 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => void load(playerId)}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t(copy.retry)}
          </button>
        </div>
      ) : (
        <>
          <section aria-labelledby="weekly-title" className="grid gap-px border border-border bg-border lg:grid-cols-[1.4fr_0.6fr]">
            <div className="relative overflow-hidden bg-card p-6 sm:p-8">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h2 id="weekly-title" className="font-pixel text-xl text-foreground">{t(copy.weekly)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{data?.summary.displayName ?? selectedPlayer.displayName}</p>
                </div>
                <p className="font-pixel text-4xl tabular-nums text-foreground sm:text-5xl" aria-live="polite">
                  {busy ? '—' : weeklyXp}
                  <span className="ml-2 text-base text-muted-foreground">/ {weeklyCap} XP</span>
                </p>
              </div>
              <div
                className="mt-6 h-4 overflow-hidden border border-border bg-deep p-0.5"
                role="progressbar"
                aria-label={t(copy.weekly)}
                aria-valuemin={0}
                aria-valuemax={weeklyCap}
                aria-valuenow={weeklyXp}
              >
                <div
                  className="h-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${busy ? 0 : percent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className={data?.summary.capReached ? 'text-warn' : 'text-muted-foreground'}>
                  {data?.summary.capReached ? t(copy.capReached) : `${data?.summary.remainingXp ?? 0} ${t(copy.remaining)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(copy.resets)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 bg-card">
              <Stat label={t(copy.lifetime)} value={data?.summary.lifetimeLabsXp} icon={Sparkles} />
              <Stat label={t(copy.playtime)} value={data ? formatPlaytime(data.summary.activePlaytimeSeconds) : '—'} icon={Clock3} />
              <Stat label={t(copy.levels)} value={data?.summary.completedLevels} icon={Check} />
              <Stat
                label={t(copy.recordsSplit)}
                value={`${data?.summary.personalRecords ?? 0} / ${data?.summary.globalRecords ?? 0}`}
                icon={Crown}
              />
            </div>
          </section>

          <section aria-labelledby="games-title" className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="games-title" className="font-pixel text-2xl text-foreground">{t(copy.allGames)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data?.summary.gamesPlayed ?? 0} {t(copy.gamesPlayed).toLowerCase()} · {data?.summary.completedLevels ?? 0} {t(copy.levels).toLowerCase()}
                </p>
              </div>
              <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary" href="/games">
                {t(copy.viewAllGames)} <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.games ?? []).map((game) => {
                const gameInfo = GAMES.find((entry) => entry.id === game.slug);
                const finished = data?.progress.find((entry) => entry.gameId === game.slug)?.completedLevels ?? 0;
                return (
                  <li key={game.id} className="border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-pixel text-lg text-foreground">{game.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{finished} {t(copy.levels).toLowerCase()}</p>
                      </div>
                      <Gamepad2 className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">{gameInfo?.status === 'play' ? 'Ready to play' : 'In your collection'}</span>
                      {gameInfo?.href && (
                        <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" href={gameInfo.href}>
                          {t(copy.play)} <ChevronRight className="size-4" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="score-boards-title" className="mt-11">
            <div className="mb-4">
              <h2 id="score-boards-title" className="font-pixel text-2xl text-foreground">{t(copy.scoreBoards)}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t(copy.scoreBoardsNote)}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {(data?.scoreBoards ?? []).map(({ game, entries }) => (
                <section key={game.id} aria-label={`${game.title} ${t(copy.scoreBoards)}`} className="border border-border bg-card">
                  <h3 className="border-b border-border px-4 py-3 font-pixel text-base text-foreground">{game.title}</h3>
                  {entries.length ? (
                    <ol className="divide-y divide-border">
                      {entries.slice(0, 5).map((entry, index) => (
                        <li key={`${entry.playerId}:${entry.levelId}`} className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="pt-0.5 font-pixel text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                            <div className="min-w-0">
                              <p className="truncate text-sm text-foreground">{entry.displayName}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{entry.levelTitle}</p>
                              <p className="mt-1 text-[11px] text-warn">{t(copy.unverified)}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-pixel text-sm tabular-nums text-primary">{entry.bestScore} {t(copy.score).toLowerCase()}</p>
                            {entry.bestTimeSeconds > 0 && (
                              <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                                {t(copy.finishTime)} {Math.floor(entry.bestTimeSeconds / 60)}:{String(entry.bestTimeSeconds % 60).padStart(2, '0')}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="p-4 text-sm leading-6 text-muted-foreground">{busy ? t(copy.loading) : t(copy.noScores)}</p>
                  )}
                </section>
              ))}
            </div>
          </section>

          <section aria-labelledby="achievements-title" className="mt-11">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 id="achievements-title" className="font-pixel text-2xl text-foreground">{t(copy.achievements)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data?.summary.unlockedAchievements ?? 0} / {data?.definitions.length ?? 0} {t(copy.unlocked).toLowerCase()}
                </p>
              </div>
              <Award className="size-6 text-warn" aria-hidden="true" />
            </div>
            {data?.definitions.length ? (
              <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {data.definitions.map((achievement) => {
                  const earned = earnedIds.has(achievement.id);
                  const Icon = achievementIcon(achievement.category);
                  return (
                    <li key={achievement.id} className={`flex min-h-36 gap-3 bg-card p-4 ${earned ? '' : 'opacity-75'}`}>
                      <div className={`grid size-10 shrink-0 place-items-center border ${earned ? 'border-warn/50 bg-warn/10 text-warn' : 'border-border bg-deep text-muted-foreground'}`}>
                        {earned ? <Icon className="size-5" aria-hidden="true" /> : <LockKeyhole className="size-4" aria-hidden="true" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-pixel text-base text-foreground">{achievement.title}</h3>
                          <span className="shrink-0 text-xs text-warn">+{achievement.baseXp} XP</span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{achievement.description}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {achievement.game.title} · {earned ? t(copy.unlocked) : t(copy.locked)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="border border-border bg-card p-5 text-sm text-muted-foreground">{busy ? t(copy.loading) : t(copy.noAchievements)}</p>
            )}
          </section>

          <div className="mt-11 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section aria-labelledby="leaderboard-title" className="border border-border bg-card">
              <div className="flex items-start justify-between gap-3 border-b border-border p-5">
                <div>
                  <h2 id="leaderboard-title" className="font-pixel text-xl text-foreground">{t(copy.leaderboard)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(copy.leaderboardNote)}</p>
                </div>
                <Trophy className="size-5 shrink-0 text-warn" aria-hidden="true" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-72 text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">{t(copy.rank)}</th>
                      <th scope="col" className="px-3 py-3 font-medium">{t(copy.player)}</th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">{t(copy.weeklyScore)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.leaderboard ?? []).slice(0, 5).map((entry, index) => (
                      <tr key={entry.playerId} className={`border-t border-border ${entry.playerId === playerId ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'}`}>
                        <td className="px-5 py-3 font-pixel">{String(index + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-3">{entry.displayName}{entry.playerId === playerId ? ` (${t(copy.you)})` : ''}</td>
                        <td className="px-5 py-3 text-right tabular-nums">{entry.weeklyXp} XP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!busy && !data?.leaderboard.length && (
                <p className="px-5 pb-5 text-sm text-muted-foreground">{t(copy.noLeaderboard)}</p>
              )}
              {currentRank >= 5 && (
                <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                  {t(copy.rank)} {currentRank + 1}: {data?.leaderboard[currentRank].weeklyXp} XP
                </p>
              )}
            </section>

            <section aria-labelledby="history-title" className="border border-border bg-card">
              <div className="flex items-start justify-between gap-3 border-b border-border p-5">
                <div>
                  <h2 id="history-title" className="font-pixel text-xl text-foreground">{t(copy.recentAwards)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(copy.weekly)}</p>
                </div>
                <Clock3 className="size-5 shrink-0 text-primary" aria-hidden="true" />
              </div>
              {data?.history.length ? (
                <ul className="divide-y divide-border">
                  {data.history.slice(0, 5).map((award) => (
                    <li key={award.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{award.ruleKey.replaceAll(':', ' · ').replaceAll('-', ' ')}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {award.game.title} · {new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium' }).format(new Date(award.createdAt))}
                        </p>
                      </div>
                      <span className="shrink-0 font-pixel text-sm text-ok">+{award.awardedXp} XP</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-5 text-sm leading-6 text-muted-foreground">{busy ? t(copy.loading) : t(copy.noAwards)}</p>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value?: number | string; icon: typeof Sparkles }) {
  return (
    <div className="flex min-h-24 items-start gap-3 border-b border-r border-border p-4 last:border-r-0 sm:p-5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="text-xs leading-5 text-muted-foreground">{label}</p>
        <p className="mt-1 font-pixel text-xl tabular-nums text-foreground">{value ?? '—'}</p>
      </div>
    </div>
  );
}
