const PATHS = {
  'sound-on':
    'M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z',
  'sound-off':
    'M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z',
  settings:
    'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
  restart: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
  fullscreen: 'M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z',
  // Two diagonal arrows to the corners (PRD section 8).
  maximize:
    'M14 3h7v7h-2V6.4l-4.3 4.3-1.4-1.4L17.6 5H14V3zM3 14h2v3.6l4.3-4.3 1.4 1.4L6.4 19H10v2H3v-7z',
  // Arrows pointing inward.
  restore:
    'M20.3 2.3 21.7 3.7 17.4 8H21v2h-7V3h2v3.6l4.3-4.3zM3 14h7v7H8v-3.6l-4.3 4.3-1.4-1.4L6.6 16H3v-2z',
} as const;

export function Icon({ name, label }: { name: keyof typeof PATHS; label: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={label}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
