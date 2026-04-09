"use client";
// components/student/Dashboard.tsx

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { GAME_CONFIG, type HistoricalEntry } from "@/lib/gameConfig";
import { calcPortfolio } from "@/lib/portfolioUtils";
import type { PortfolioSnapshot } from "@/lib/portfolioUtils";
import type { Trade, GameState } from "@/lib/supabaseClient";
import PriceChart from "./PriceChart";
import Portfolio from "./Portfolio";
import TradePanel from "./TradePanel";

interface DashboardProps {
  playerId: string;
  playerName: string;
  historicalPrices: HistoricalEntry[];
}

export default function Dashboard({ playerId, playerName, historicalPrices }: DashboardProps) {
  const [gameState, setGameState] = useState<GameState>({ id: 1, current_tick: 0, is_playing: false, market_price: 15 });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot>({
    cash: GAME_CONFIG.INITIAL_WALLET_BALANCE,
    holdings: [],
    totalValue: GAME_CONFIG.INITIAL_WALLET_BALANCE,
  });

  // Current price is set by the Admin in game_state
  const currentPrice = gameState.market_price || GAME_CONFIG.getFundamentalValue(gameState.current_tick);
  const currentPrices: Record<string, number> = {
    ASSET: currentPrice
  };

  // Fetch initial game state
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("game_state").select("*").eq("id", 1).single();
      if (data) setGameState(data as GameState);
    })();
  }, []);

  // Fetch trades for this player
  const fetchTrades = useCallback(async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: true });
    if (data) setTrades(data as Trade[]);
  }, [playerId]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // Recalculate portfolio whenever trades or prices change
  useEffect(() => {
    setPortfolio(calcPortfolio(trades, currentPrices));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, gameState.current_tick]);

  // Update portfolio value in Supabase (for leaderboard)
  useEffect(() => {
    if (trades.length === 0 && gameState.current_tick === 0) return;
    supabase
      .from("players")
      .update({ portfolio_value: portfolio.totalValue })
      .eq("id", playerId)
      .then(() => {});
  }, [portfolio.totalValue, playerId, trades.length, gameState.current_tick]);

  // Realtime: game_state changes
  useEffect(() => {
    const channel = supabase
      .channel("student-game-state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_state", filter: `id=eq.1` },
        (payload) => {
          setGameState(payload.new as GameState);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Realtime: own trades
  useEffect(() => {
    const channel = supabase
      .channel("student-trades")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trades", filter: `player_id=eq.${playerId}` },
        () => { fetchTrades(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [playerId, fetchTrades]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(10,14,26,0.85)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <span className="font-bold text-sm gradient-text">Bubble Experiment</span>
          </div>
          <div className="flex items-center gap-3">
            {/* FV TIP */}
            <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
               <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter mr-2">Intrinsic Value:</span>
               <span className="text-xs font-bold mono text-white">€{GAME_CONFIG.getFundamentalValue(gameState.current_tick)}</span>
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              👋 {playerName}
            </span>
          </div>
        </div>

        {/* Round counter */}
        <div
          className="px-4 pb-3 flex items-center gap-3"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest">Round</span>
          <span className="text-sm font-bold mono" style={{ color: "var(--accent-blue)" }}>
            {gameState.current_tick + 1}
          </span>
          <div
            className="flex-1 rounded-full h-1.5 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((gameState.current_tick + 1) / GAME_CONFIG.TOTAL_GAME_TICKS) * 100}%`,
                background: "linear-gradient(90deg, var(--accent-blue), var(--accent-purple))",
              }}
            />
          </div>
          <span className="text-[10px] font-bold">{GAME_CONFIG.TOTAL_GAME_TICKS}</span>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-6 pb-8">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl">💎</div>
               <div>
                  <h2 className="font-bold text-lg">Dividend Asset</h2>
                  <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">E(D) = €1 / Round</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Market Price</p>
               <p className="text-2xl font-black mono text-white">€{currentPrice}</p>
            </div>
        </div>

        {/* Chart */}
        <PriceChart
          data={historicalPrices}
          selectedAsset="ASSET"
          currentTick={gameState.current_tick}
        />

        {/* Portfolio */}
        <Portfolio portfolio={portfolio} currentPrices={currentPrices} />

        {/* Trade panel */}
        <TradePanel
          playerId={playerId}
          selectedAsset="ASSET"
          currentPrice={currentPrice}
          currentTick={gameState.current_tick}
          portfolio={portfolio}
          gameIsPlaying={gameState.is_playing}
          onTrade={fetchTrades}
        />
      </main>
    </div>
  );
}
