export interface XploreLabsAuthProvider {
  getAccessToken(): Promise<string | null>;
}

declare global {
  interface Window {
    xploreLabsAuth?: XploreLabsAuthProvider;
  }
}

/** Supabase mode always requires a signed Xplore JWT, even during local development. */
export async function getSupabaseAuthHeaders(): Promise<Record<string, string>> {
  const accessToken = await window.xploreLabsAuth?.getAccessToken();
  if (!accessToken) throw new Error('Sign in to Xplore to load your Supabase Labs profile.');
  return { authorization: `Bearer ${accessToken}` };
}

export async function getLabsAuthHeaders(): Promise<Record<string, string>> {
  if (process.env.NODE_ENV === 'development') {
    return { 'x-labs-player': getLocalPlayerId() };
  }

  const accessToken = await window.xploreLabsAuth?.getAccessToken();
  if (!accessToken) throw new Error('Sign in to Xplore to load your Labs profile.');
  return { authorization: `Bearer ${accessToken}` };
}

function getLocalPlayerId(): string {
  const saved = window.localStorage.getItem('labs:development-player');
  const validIds = new Set([
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000005',
  ]);
  return saved && validIds.has(saved) ? saved : '00000000-0000-4000-8000-000000000001';
}
