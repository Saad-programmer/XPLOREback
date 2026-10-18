import type { Mood } from '../content/schema';

const INK = '#1a1b26';
const BEAK = '#ff9e64';

function Eyes({ mood }: { mood: Mood }) {
  const stroke = { stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mood) {
    case 'happy':
      return <path d="M23 30q3-4 6 0M35 30q3-4 6 0" {...stroke} />;
    case 'thinking':
      return (
        <>
          <circle cx="27.5" cy="27.5" r="2.4" fill={INK} />
          <circle cx="39.5" cy="27.5" r="2.4" fill={INK} />
          <path d="M36 22.5l6-1.5" {...stroke} />
        </>
      );
    case 'shocked':
      return (
        <>
          <circle cx="26" cy="28.5" r="4.2" fill="#fff" stroke={INK} strokeWidth="1.4" />
          <circle cx="38" cy="28.5" r="4.2" fill="#fff" stroke={INK} strokeWidth="1.4" />
          <circle cx="26" cy="28.5" r="1.6" fill={INK} />
          <circle cx="38" cy="28.5" r="1.6" fill={INK} />
        </>
      );
    case 'proud':
      // The sysadmin's sunglasses.
      return (
        <path
          d="M20.5 26.5h23v2.5c0 2.5-2 4-4.5 4h-2.5c-2 0-3-1.5-4.5-3-1.5 1.5-2.5 3-4.5 3H25c-2.5 0-4.5-1.5-4.5-4z"
          fill={INK}
        />
      );
    case 'disappointed':
      return <path d="M23 30.5h6M35 30.5h6M23 25.5l6 2M41 25.5l-6 2" {...stroke} />;
    case 'laughing':
      return <path d="M23 26.5l5 2.5-5 2.5M41 26.5l-5 2.5 5 2.5" {...stroke} />;
    case 'sleeping':
      return <path d="M23 29q3 3 6 0M35 29q3 3 6 0" {...stroke} />;
    default:
      return (
        <>
          <circle cx="26" cy="29" r="2.4" fill={INK} />
          <circle cx="38" cy="29" r="2.4" fill={INK} />
        </>
      );
  }
}

/**
 * Placeholder guide (PRD section 6): an original penguin with a headset,
 * not Tux. Real art (Rive) replaces it later.
 */
export function Penguin({ mood = 'neutral', size = 64 }: { mood?: Mood; size?: number }) {
  const openBeak = mood === 'shocked' || mood === 'laughing';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="25" cy="60" rx="5" ry="2.5" fill={BEAK} />
      <ellipse cx="39" cy="60" rx="5" ry="2.5" fill={BEAK} />
      <ellipse cx="32" cy="36" rx="20" ry="23" fill="#2e3452" stroke="#4b5279" strokeWidth="1.5" />
      <ellipse cx="32" cy="40" rx="13.5" ry="17" fill="#e6e9f5" />
      <Eyes mood={mood} />
      {openBeak ? (
        <path d="M28.5 34h7l-3.5 2.2zM29.5 37.2h5l-2.5 2.6z" fill={BEAK} />
      ) : (
        <path d="M28.5 34h7l-3.5 4z" fill={BEAK} />
      )}
      <path d="M11.5 31a20.5 20.5 0 0 1 41 0" fill="none" stroke="var(--zone)" strokeWidth="2.6" />
      <rect x="8.5" y="28" width="6" height="10" rx="2.5" fill="var(--zone)" />
      <rect x="49.5" y="28" width="6" height="10" rx="2.5" fill="var(--zone)" />
      <path d="M12 37.5q2 7 10 7.5" fill="none" stroke="var(--zone)" strokeWidth="1.8" />
      <circle cx="22.5" cy="45" r="1.8" fill="var(--zone)" />
      {mood === 'sleeping' && (
        <text x="46" y="14" fontSize="10" fill="var(--muted)" fontFamily="var(--font-display)">
          z
        </text>
      )}
    </svg>
  );
}
