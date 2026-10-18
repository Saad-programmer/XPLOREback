import Link from 'next/link';
import { missions } from '@/src/games/linux/content';
import { GAME_TITLE } from '@/src/games/linux/meta';
import { pickText } from '@/src/shared/i18n/text';

// Placeholder until the title screen (step 6) and the mission map (step 7).
export default function LinuxGamePage() {
  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>{GAME_TITLE}</h1>
      <ol>
        {missions.map((mission) => (
          <li key={mission.id}>
            <Link href={`/linux/${mission.id}`}>{pickText(mission.title, 'fr')}</Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
