import type { Metadata } from 'next';
import { asset } from '@/src/shared/asset';
import styles from '../nextHop/page.module.css';

export const metadata: Metadata = { title: 'Seek & Command | Xplore Labs' };

export default function SQLGamePage() {
  return (
    <main className={styles.player}>
      <iframe
        className={styles.game}
        src={asset('games/SQLGame/index.html')}
        title="Seek & Command"
        allow="autoplay"
        allowFullScreen
      />
    </main>
  );
}