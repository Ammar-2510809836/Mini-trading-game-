"use client";
// components/admin/GameControls.tsx

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { GAME_CONFIG } from "@/lib/gameConfig";
import type { GameState } from "@/lib/supabaseClient";

interface GameControlsProps {
  gameState: GameState;
  onStateChange: (s: GameState) => void;
}

export default function GameControls({ gameState, onStateChange }: GameControlsProps) {
  const [loading, setLoading] = useState(false);
  const [localPrice, setLocalPrice] = useState(gameState.market_price?.toString() || "15");
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const currentTickRef = useRef(gameState.current_tick);
  currentTickRef.current = gameState.current_tick;

  // Keep local price input in sync with db when it changes remotely
  useEffect(() => {
    setLocalPrice(gameState.market_price?.toString() || "15");
  }, [gameState.market_price]);

  async function updateState(patch: Partial<GameState>) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("game_state")
        .update(patch)
        .eq("id", 1)
        .select()
        .single();
      if (error) throw error;
      onStateChange(data as GameState);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!confirm("⚠️ CAUTION: This will DELETE all students and all trade history. Are you sure?")) return;
    
    setLoading(true);
    try {
      // 1. Delete all trades
      await supabase.from("trades").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // 2. Delete all players
      await supabase.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // 3. Reset game state
      await updateState({ 
        current_tick: 0, 
        is_playing: false, 
        market_price: 15 
      });
      alert("Database wiped. Ready for fresh start!");
    } catch (err) {
      console.error(err);
      alert("Failed to reset database.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNextTick() {
    const next = Math.min(currentTickRef.current + 1, GAME_CONFIG.TOTAL_GAME_TICKS - 1);
    await updateState({ current_tick: next, is_playing: true });
  }

  function stopAutoPlay() {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    setAutoPlaying(false);
  }

  async function toggleAutoPlay() {
    if (autoPlaying) {
      stopAutoPlay();
      await updateState({ is_playing: false });
      return;
    }

    setAutoPlaying(true);
    await updateState({ is_playing: true });

    autoPlayRef.current = setInterval(async () => {
      const next = currentTickRef.current + 1;
      if (next >= GAME_CONFIG.TOTAL_GAME_TICKS) {
        stopAutoPlay();
        await supabase.from("game_state").update({ is_playing: false }).eq("id", 1);
        return;
      }
      await supabase.from("game_state").update({ current_tick: next }).eq("id", 1);
    }, GAME_CONFIG.AUTO_PLAY_TICK_SPEED_MS);
  }

  async function updateMarketPrice() {
    const p = parseFloat(localPrice);
    if (!isNaN(p)) {
      await updateState({ market_price: p });
    }
  }

  const isAtEnd = gameState.current_tick >= GAME_CONFIG.TOTAL_GAME_TICKS - 1;

  return (
    <div className="glass-card p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-blue-500/10">🎮</div>
        <div>
          <h2 className="font-bold text-lg">Game Master</h2>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Global Controls</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Current Round</p>
           <p className="text-3xl font-black mono text-blue-400">
             {gameState.current_tick + 1} <span className="text-sm text-white/20">/ {GAME_CONFIG.TOTAL_GAME_TICKS}</span>
           </p>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Intrinsic Value</p>
           <p className="text-3xl font-black mono text-purple-400">
             €{GAME_CONFIG.getFundamentalValue(gameState.current_tick)}
           </p>
        </div>
      </div>

      {/* ADMIN PRICE SETTER */}
      <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Set Market Price (€)</p>
        <div className="flex gap-2">
           <input 
              type="number" 
              className="game-input flex-1 text-xl font-bold"
              value={localPrice}
              onChange={(e) => setLocalPrice(e.target.value)}
              onBlur={updateMarketPrice}
              onKeyPress={(e) => e.key === 'Enter' && updateMarketPrice()}
           />
           <button 
             onClick={updateMarketPrice}
             className="btn-primary px-4 text-xs font-bold"
           >
             UPDATE
           </button>
        </div>
        <p className="text-[8px] mt-2 text-white/40">This price updates all student screens immediately.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleNextTick}
            disabled={loading || autoPlaying || isAtEnd}
            className="btn-primary py-4 font-bold"
          >
            ⏭️ NEXT ROUND
          </button>
          <button
            onClick={toggleAutoPlay}
            disabled={loading || isAtEnd}
            className="btn-primary py-4 font-bold"
            style={{
              background: autoPlaying
                ? "linear-gradient(135deg, #dc2626, #ef4444)"
                : "linear-gradient(135deg, #059669, #10b981)",
            }}
          >
            {autoPlaying ? "⏸ STOP AUTO" : "▶️ AUTO-PLAY"}
          </button>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/5 transition-colors"
        >
          🗑️ Wipe Data & Reset to Round 1
        </button>
      </div>
    </div>
  );
}
