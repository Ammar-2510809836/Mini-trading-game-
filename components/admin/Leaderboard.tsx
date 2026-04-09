"use client";
// components/admin/Leaderboard.tsx

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { calcPortfolio, formatUSD } from "@/lib/portfolioUtils";
import { GAME_CONFIG } from "@/lib/gameConfig";
import type { Player, Trade } from "@/lib/supabaseClient";

interface LeaderboardRow {
  player: Player;
  totalValue: number;
  pnl: number;
  pnlPct: number;
}

interface LeaderboardProps {
  currentPrices: Record<string, number>;
  currentTick: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ currentPrices, currentTick }: LeaderboardProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  const refresh = useCallback(async () => {
    // Fetch all players
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: true });

    if (!players?.length) return;

    // Fetch all trades
    const { data: allTrades } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: true });

    const tradesByPlayer: Record<string, Trade[]> = {};
    for (const trade of (allTrades ?? []) as Trade[]) {
      tradesByPlayer[trade.player_id] ??= [];
      tradesByPlayer[trade.player_id].push(trade);
    }

    const computed: LeaderboardRow[] = (players as Player[]).map((p) => {
      const playerTrades = tradesByPlayer[p.id] ?? [];
      const portfolio = calcPortfolio(playerTrades, currentPrices);
      const pnl = portfolio.totalValue - GAME_CONFIG.INITIAL_WALLET_BALANCE;
      const pnlPct = (pnl / GAME_CONFIG.INITIAL_WALLET_BALANCE) * 100;
      return { player: p, totalValue: portfolio.totalValue, pnl, pnlPct };
    });

    // Sort descending by total value
    computed.sort((a, b) => b.totalValue - a.totalValue);
    setRows(computed);
  }, [currentPrices]);

  // Initial fetch + refetch when tick changes
  useEffect(() => { refresh(); }, [refresh, currentTick]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "trades" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(245,158,11,0.15)" }}
        >
          🏆
        </div>
        <div>
          <h2 className="font-bold text-lg">Live Leaderboard</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {rows.length} player{rows.length !== 1 ? "s" : ""} • updates in real-time
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--accent-green)" }}
          />
          <span className="text-xs text-positive font-medium">LIVE</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div
          className="text-center py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <p className="text-3xl mb-3">👀</p>
          Waiting for players to join...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--text-muted)" }}>
                <th className="text-left pb-3 font-medium text-xs uppercase tracking-widest pr-4">#</th>
                <th className="text-left pb-3 font-medium text-xs uppercase tracking-widest">Player</th>
                <th className="text-right pb-3 font-medium text-xs uppercase tracking-widest">Portfolio</th>
                <th className="text-right pb-3 font-medium text-xs uppercase tracking-widest pl-4">P&L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rankClass =
                  i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
                return (
                  <tr
                    key={row.player.id}
                    id={`leaderboard-row-${i + 1}`}
                    className={`${rankClass} transition-all duration-500 border-b fade-in`}
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <td className="py-3 pr-4">
                      <span className="text-lg">
                        {i < 3 ? MEDALS[i] : <span className="font-bold mono text-sm" style={{ color: "var(--text-muted)" }}>{i + 1}</span>}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold">{row.player.name}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="mono font-semibold gradient-text-gold">
                        {formatUSD(row.totalValue)}
                      </span>
                    </td>
                    <td className="py-3 text-right pl-4">
                      <span
                        className={`mono text-sm font-medium ${row.pnl >= 0 ? "text-positive" : "text-negative"}`}
                      >
                        {row.pnl >= 0 ? "+" : ""}{row.pnlPct.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
