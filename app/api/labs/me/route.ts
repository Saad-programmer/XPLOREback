import { authenticateLabsRequest, jsonError, serviceClient } from '@/src/labs/supabase-server';

export async function GET(request: Request) {
  try {
    const identity = await authenticateLabsRequest(request);
    const admin = serviceClient();
    const { data, error } = await admin
      .from('labs_xp_ledger')
      .select('amount')
      .eq('user_id', identity.userId);
    if (error) throw error;
    const points = (data ?? []).reduce((total, entry) => total + entry.amount, 0);
    const name =
      (typeof identity.user.user_metadata.display_name === 'string' &&
        identity.user.user_metadata.display_name) ||
      (typeof identity.user.user_metadata.full_name === 'string' &&
        identity.user.user_metadata.full_name) ||
      identity.user.email?.split('@')[0] ||
      'Xplore player';
    return Response.json(
      { id: identity.userId, name, points },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
