import type { Metadata } from 'next';
import { asset } from '@/src/shared/asset';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Next Hop | Xplore Labs' };

export default function NextHopPage() {
  return (
    <main className={styles.player}>
      <iframe
        className={styles.game}
        src={asset('games/nextHop/index.html')}
        title="Next Hop"
        allow="autoplay"
        allowFullScreen
      />
    </main>
  );
}