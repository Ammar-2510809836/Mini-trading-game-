// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — initialised on first use, not at module load time.
// This prevents build failures when env vars are not yet configured.
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Copy .env.example → .env.local and fill in your values."
    );
  }

  _client = createClient(url, key);
  return _client;
}

// Convenience proxy so existing code using `supabase.xxx` keeps working.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ── Database row types ────────────────────────────────────────
export interface GameState {
  id: number;
  current_tick: number;
  is_playing: boolean;
  market_price: number; // New: admin-set price
}

export interface Player {
  id: string;
  name: string;
  portfolio_value: number;
  created_at: string;
}

export interface Trade {
  id: string;
  player_id: string;
  asset_symbol: string;
  trade_type: "BUY" | "SELL";
  amount_usd: number;
  price_at_execution: number;
  tick_executed: number;
  created_at: string;
}
