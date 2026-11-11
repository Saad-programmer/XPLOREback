import Image from 'next/image';
import menu from '@/src/games/SQLGame/5Vst3i.png';
import seek from '@/src/games/SQLGame/i05idB.png';
import title from '@/src/games/SQLGame/capsule-art.png';
import styles from './SqlGamePreview.module.css';

const scenes = [
  { image: title, name: 'Title screen', style: styles.title },
  { image: menu, name: 'Game modes', style: styles.menu },
  { image: seek, name: 'Seek mode', style: styles.seek },
];

export function SqlGamePreview() {
  return (
    <div className={styles.preview} role="img" aria-label="Seek & Command gameplay preview">
      {scenes.map((scene) => (
        <Image
          key={scene.name}
          src={scene.image}
          alt=""
          fill
          priority={scene.name === 'Title screen'}
          sizes="(min-width: 1152px) 640px, (min-width: 1024px) 56vw, 100vw"
          className={`${styles.scene} ${scene.style}`}
        />
      ))}
      <div className={styles.label} aria-hidden="true">
        <span className={styles.liveDot} />
        <span>GAMEPLAY PREVIEW</span>
      </div>
      <div className={styles.query} aria-hidden="true">
        <span>SELECT * FROM people;</span>
        <span className={styles.caret} />
      </div>
    </div>
  );
}
