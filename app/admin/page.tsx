"use client";
// app/admin/page.tsx — Admin View (desktop/presentation screen)

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { GAME_CONFIG } from "@/lib/gameConfig";
import type { GameState } from "@/lib/supabaseClient";
import GameControls from "@/components/admin/GameControls";
import QRCodeDisplay from "@/components/admin/QRCodeDisplay";
import Leaderboard from "@/components/admin/Leaderboard";
import BubbleChart from "@/components/admin/BubbleChart";

export default function AdminPage() {
  const [gameState, setGameState] = useState<GameState>({ id: 1, current_tick: 0, is_playing: false, market_price: 15 });
  
  // (Existing effects omitted for brevity -- keeping original logic)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("game_state").select("*").eq("id", 1).single();
      if (data) setGameState(data as GameState);
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-game-state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_state", filter: `id=eq.1` },
        (payload) => setGameState(payload.new as GameState)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const currentPrices: Record<string, number> = {
    ASSET: gameState.market_price ?? GAME_CONFIG.getFundamentalValue(gameState.current_tick),
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header
        className="border-b"
        style={{
          background: "rgba(10,14,26,0.9)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <h1 className="text-xl font-bold gradient-text">Teacher Dashboard</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Bubbles & Market Efficiency Experiment</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current Round</p>
            <p className="font-semibold mono text-lg" style={{ color: "var(--accent-blue)" }}>
              Round {gameState.current_tick + 1}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left column — Controls */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
             <QRCodeDisplay />
             <GameControls
                gameState={gameState}
                onStateChange={setGameState}
              />
          </div>

          {/* Center/Right column — Bubble Chart & Leaderboard */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="h-[450px]">
              <BubbleChart />
            </div>
            
            <Leaderboard
              currentPrices={currentPrices}
              currentTick={gameState.current_tick}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
