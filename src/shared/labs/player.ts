export const ACTIVE_PLAYER_KEY = 'labs:development-player';
export const PLAYER_CHANGED_EVENT = 'labs:development-player-changed';

export const DEVELOPMENT_PLAYERS = [
  { id: '00000000-0000-4000-8000-000000000001', displayName: 'Alice' },
  { id: '00000000-0000-4000-8000-000000000002', displayName: 'Bob' },
  { id: '00000000-0000-4000-8000-000000000003', displayName: 'Charlie' },
  { id: '00000000-0000-4000-8000-000000000004', displayName: 'Diana' },
  { id: '00000000-0000-4000-8000-000000000005', displayName: 'Eve' },
] as const;

export type DevelopmentPlayerId = (typeof DEVELOPMENT_PLAYERS)[number]['id'];

export function getSelectedDevelopmentPlayer(): DevelopmentPlayerId {
  const saved = window.localStorage.getItem(ACTIVE_PLAYER_KEY);
  return DEVELOPMENT_PLAYERS.find((player) => player.id === saved)?.id ?? DEVELOPMENT_PLAYERS[0].id;
}

export function selectDevelopmentPlayer(id: string): void {
  const player = DEVELOPMENT_PLAYERS.find((option) => option.id === id);
  if (!player) return;

  window.localStorage.setItem(ACTIVE_PLAYER_KEY, player.id);
  window.dispatchEvent(new CustomEvent(PLAYER_CHANGED_EVENT, { detail: player.id }));
}
