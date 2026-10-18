import type { Metadata } from 'next';
import { GAME_TITLE } from '@/src/games/linux/meta';
import { TitleScreen } from '@/src/games/linux/ui/TitleScreen';

export const metadata: Metadata = { title: GAME_TITLE };

export default function LinuxTitlePage() {
  return <TitleScreen />;
}
