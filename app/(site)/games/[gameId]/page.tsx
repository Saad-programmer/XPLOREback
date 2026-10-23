import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { pickText } from '@/src/shared/i18n/text';
import { GAMES } from '@/src/shared/games';
import { GameDetails, GameDetailsSkeleton } from '@/src/shared/site/GameDetails';
import { GAME_ABOUT } from '@/src/shared/site/game-about';
import { Markdown } from '@/src/shared/site/Markdown';

export function generateStaticParams() {
  return GAMES.map((game) => ({ gameId: game.id }));
}

export async function generateMetadata({
  params,
}: PageProps<'/games/[gameId]'>): Promise<Metadata> {
  const { gameId } = await params;
  const game = GAMES.find((entry) => entry.id === gameId);
  return game
    ? {
        title: `${pickText(game.title, 'en')} | Xplore Labs`,
        description: pickText(game.blurb, 'en'),
      }
    : {};
}

async function Details({ params }: Pick<PageProps<'/games/[gameId]'>, 'params'>) {
  const { gameId } = await params;
  const game = GAMES.find((entry) => entry.id === gameId);
  if (!game) notFound();
  const facts = GAME_ABOUT[game.id];

  return (
    <GameDetails
      gameId={game.id}
      missionCount={facts?.missions ?? null}
      about={
        facts && {
          en: <Markdown>{facts.about.en}</Markdown>,
          fr: <Markdown>{facts.about.fr}</Markdown>,
        }
      }
    />
  );
}

/** Game details: capsule art, Play now, and the "More info" Markdown page. */
export default function GamePage({ params }: PageProps<'/games/[gameId]'>) {
  return (
    <Suspense fallback={<GameDetailsSkeleton />}>
      <Details params={params} />
    </Suspense>
  );
}
