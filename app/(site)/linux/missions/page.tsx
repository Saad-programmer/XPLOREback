import type { Metadata } from 'next';
import { GAME_TITLE } from '@/src/games/linux/meta';
import { MissionMap } from '@/src/games/linux/ui/MissionMap';

export const metadata: Metadata = { title: `Missions | ${GAME_TITLE}` };

export default function MissionsPage() {
  return <MissionMap />;
}
