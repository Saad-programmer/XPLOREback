import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getMission, missions } from '@/src/games/linux/content';
import { GAME_TITLE } from '@/src/games/linux/meta';
import { pickText } from '@/src/shared/i18n/text';
import { GameScreen } from '@/src/games/linux/ui/GameScreen';

export function generateStaticParams() {
  return missions.map((mission) => ({ missionId: mission.id }));
}

export async function generateMetadata({
  params,
}: PageProps<'/linux/[missionId]'>): Promise<Metadata> {
  const mission = getMission((await params).missionId);
  return { title: mission ? `${pickText(mission.title, 'en')} | ${GAME_TITLE}` : GAME_TITLE };
}

async function Mission({ params }: { params: PageProps<'/linux/[missionId]'>['params'] }) {
  const { missionId } = await params;
  if (!getMission(missionId)) notFound();
  return <GameScreen missionId={missionId} />;
}

// Reading the URL inside <Suspense> keeps navigation instant (Next.js instant navigation).
export default function MissionPage({ params }: PageProps<'/linux/[missionId]'>) {
  return (
    <Suspense fallback={<main style={{ minHeight: '100dvh', background: 'var(--night)' }} />}>
      <Mission params={params} />
    </Suspense>
  );
}
