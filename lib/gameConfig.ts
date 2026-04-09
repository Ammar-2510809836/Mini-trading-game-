// ============================================================
// lib/gameConfig.ts
// Central configuration — tweak these values freely.
// All game constants live here; never hardcode them in components.
// ============================================================

export const GAME_CONFIG = {
  // ── Wallet ───────────────────────────────────────────────
  /** Starting cash balance for students (as per Step 1 in PPT) */
  INITIAL_WALLET_BALANCE: 100,
  /** Students start with 2 units of the asset */
  INITIAL_ASSET_UNITS: 2,

  // ── Assets ───────────────────────────────────────────────
  /** For bubble experiments, we use a single generic asset */
  ASSETS: [
    { symbol: "ASSET", label: "Dividend Asset", color: "#3b82f6", icon: "💎" },
  ] as const,

  // ── Game timeline ─────────────────────────────────────────
  /** 10 Rounds as per the latest instruction */
  TOTAL_GAME_TICKS: 10,

  /** Speed of auto-play (milliseconds per tick) */
  AUTO_PLAY_TICK_SPEED_MS: 5_000,

  // ── Bubble Experiment Logic ───────────────────────────────
  /** 
   * As per PPT: Round 1 = €15, Round 10 = €6.
   * Formula: (Total Rounds - Current Round) + Terminal Value of 5
   */
  getFundamentalValue: (currentTick: number) => {
    const totalRounds = 10;
    const roundsRemaining = totalRounds - currentTick; 
    return Math.max(0, roundsRemaining + 5);
  },

  // ── Trade constraints ─────────────────────────────────────
  MIN_TRADE_AMOUNT_USD: 1,
  MAX_TRADE_FRACTION: 1.0,
} as const;

export type AssetSymbol = (typeof GAME_CONFIG.ASSETS)[number]["symbol"];

export type HistoricalEntry = {
  tick: number;
  date: string;
  BTC_price: number;
  Gold_price: number;
  Oil_price: number;
};
