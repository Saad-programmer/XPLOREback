import { Penguin } from '@/src/games/linux/ui/Penguin';
import type { GameId } from '../bridge/types';
import styles from './GameThumb.module.css';

/**
 * Card thumbnails. The Linux one is a tiny terminal that types a command on
 * hover or focus (PRD: hover plays a short looping preview). Placeholder art
 * until the games have real covers in public/games/<game>/cover/.
 */
export function GameThumb({ id }: { id: GameId }) {
  if (id === 'linux') {
    return (
      <div className={styles.thumb} data-game="linux" aria-hidden="true">
        <div className={styles.term}>
          <p>
            <span className={styles.prompt}>intern@fst:~$</span>{' '}
            <span className={styles.typed}>ls -a</span>
          </p>
          <p className={styles.output}>.secret_scroll&nbsp;&nbsp;notes.txt</p>
          <p>
            <span className={styles.prompt}>intern@fst:~$</span>{' '}
            <span className={styles.typed2}>cat .secret_scroll</span>
          </p>
          <p className={styles.output2}>k7Qx-PENGU-42</p>
        </div>
        <div className={styles.mascot}>
          <Penguin mood="happy" size={64} />
        </div>
      </div>
    );
  }
  return (
    <div className={styles.thumb} data-game={id} aria-hidden="true">
      <svg className={styles.icon} viewBox="0 0 120 80" width="120" height="80">
        {id === 'sql' && (
          <g fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="20" y="12" width="80" height="56" rx="4" />
            <path d="M20 30h80M20 49h80M47 12v56M74 12v56" />
          </g>
        )}
        {id === 'git' && (
          <g fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M30 66V14M30 46c0-14 30-10 30-26M60 20v0" />
            <circle cx="30" cy="66" r="6" fill="currentColor" />
            <circle cx="30" cy="40" r="6" />
            <circle cx="30" cy="14" r="6" />
            <circle cx="60" cy="20" r="6" fill="currentColor" />
            <path d="M60 26c0 20 30 16 30 40" />
            <circle cx="90" cy="66" r="6" />
          </g>
        )}
        {id === 'network' && (
          <g fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M24 56L60 20L96 56L60 66Z M60 20v46" />
            {[
              [24, 56],
              [60, 20],
              [96, 56],
              [60, 66],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="var(--deep)" />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
