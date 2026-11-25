'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { getSupabaseAuthHeaders } from '../labs/auth';
import { useText } from '../i18n/use-text';

const copy = {
  label: { en: 'This week', fr: 'Cette semaine' },
  unavailable: { en: 'Weekly XP is unavailable', fr: 'XP hebdomadaire indisponible' },
};

interface WeeklyXp {
  used: number;
  cap: number;
}

function currentWeekStart(): string {
  const date = new Date();
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function userIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      xplore_user_id?: unknown;
    };
    return typeof claims.xplore_user_id === 'string' ? claims.xplore_user_id : null;
  } catch {
    return null;
  }
}

/** Weekly Labs XP meter; its limit is read from the database, never duplicated here. */
export function WeeklyXpBadge() {
  const t = useText();
  const [weeklyXp, setWeeklyXp] = useState<WeeklyXp | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const headers = await getSupabaseAuthHeaders();
        const token = headers.authorization?.replace(/^Bearer\s+/i, '');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const userId = token ? userIdFromToken(token) : null;
        if (!token || !url || !key || !userId)
          throw new Error('Authenticated Supabase Labs session required.');

        const client = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          global: { headers: { authorization: `Bearer ${token}` } },
        });
        const [balance, config] = await Promise.all([
          client
            .from('labs_xp_ledger')
            .select('amount')
            .eq('user_id', userId)
            .eq('week_start', currentWeekStart()),
          client.from('labs_config').select('value').eq('key', 'weekly_xp_cap').single(),
        ]);
        if (balance.error) throw balance.error;
        if (config.error) throw config.error;
        if (active) {
          setWeeklyXp({
            used: (balance.data ?? []).reduce((total, row) => total + row.amount, 0),
            cap: config.data.value,
          });
        }
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (process.env.NEXT_PUBLIC_LABS_BRIDGE !== 'supabase') return null;
  const progress = weeklyXp ? Math.min(100, (weeklyXp.used / weeklyXp.cap) * 100) : 0;

  return (
    <aside
      className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-l-2 border-ok bg-card/80 px-4 py-3"
      aria-label={t(copy.label)}
    >
      <div className="flex min-w-40 flex-1 items-baseline justify-between gap-4">
        <span className="text-sm text-muted-foreground">{t(copy.label)}</span>
        {weeklyXp ? (
          <strong className="font-pixel text-sm tabular-nums text-foreground" aria-live="polite">
            {weeklyXp.used} / {weeklyXp.cap} XP
          </strong>
        ) : failed ? (
          <span role="status" className="text-sm text-warn">
            {t(copy.unavailable)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground" role="status">
            …
          </span>
        )}
      </div>
      {weeklyXp ? (
        <div
          className="h-1.5 w-full overflow-hidden bg-secondary sm:w-40"
          role="progressbar"
          aria-label={t(copy.label)}
          aria-valuemin={0}
          aria-valuemax={weeklyXp.cap}
          aria-valuenow={weeklyXp.used}
        >
          <div
            className="h-full bg-ok transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : (
        <div className="h-1.5 w-full bg-secondary sm:w-40" aria-hidden="true" />
      )}
    </aside>
  );
}
