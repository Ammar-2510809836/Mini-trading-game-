-- ============================================================
-- Mini Trading Game — Supabase SQL Schema
-- Run this entire file in your Supabase SQL Editor:
-- https://supabase.com/dashboard > SQL Editor > New Query
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. game_state  (single-row control table)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_state (
  id            INTEGER PRIMARY KEY DEFAULT 1,   -- always 1
  current_tick  INTEGER NOT NULL DEFAULT 0,
  is_playing    BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the single control row
INSERT INTO public.game_state (id, current_tick, is_playing)
VALUES (1, 0, FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read game_state"
  ON public.game_state FOR SELECT
  TO anon USING (true);

CREATE POLICY "Allow anon update game_state"
  ON public.game_state FOR UPDATE
  TO anon USING (true) WITH CHECK (true);

-- Enable Realtime on game_state
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;

-- ──────────────────────────────────────────────
-- 2. players
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  portfolio_value FLOAT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read players"
  ON public.players FOR SELECT
  TO anon USING (true);

CREATE POLICY "Allow anon insert players"
  ON public.players FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update players"
  ON public.players FOR UPDATE
  TO anon USING (true) WITH CHECK (true);

-- Enable Realtime on players
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- ──────────────────────────────────────────────
-- 3. trades
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trades (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id          UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  asset_symbol       TEXT NOT NULL,                     -- 'BTC' | 'Gold' | 'Oil'
  trade_type         TEXT NOT NULL CHECK (trade_type IN ('BUY','SELL')),
  amount_usd         FLOAT NOT NULL,                    -- USD value of the trade
  price_at_execution FLOAT NOT NULL,                    -- asset price at trade time
  tick_executed      INTEGER NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read trades"
  ON public.trades FOR SELECT
  TO anon USING (true);

CREATE POLICY "Allow anon insert trades"
  ON public.trades FOR INSERT
  TO anon WITH CHECK (true);

-- Enable Realtime on trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
