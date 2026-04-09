"use client";
// components/student/LoginForm.tsx

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { GAME_CONFIG } from "@/lib/gameConfig";

interface LoginFormProps {
  onLogin: (playerId: string, playerName: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("players")
        .insert({
          name: trimmed,
          portfolio_value: GAME_CONFIG.INITIAL_WALLET_BALANCE,
        })
        .select("id, name")
        .single();

      if (insertError) throw insertError;

      localStorage.setItem("player_id", data.id);
      localStorage.setItem("player_name", data.name);
      onLogin(data.id, data.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decorations */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
      </div>

      <div className="glass-card p-8 w-full max-w-sm fade-in relative z-10">
        {/* Logo & title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📈</div>
          <h1 className="text-2xl font-bold gradient-text mb-2">
            Mini Trading Game
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Enter your name to join the game
          </p>
        </div>

        {/* Assets preview */}
        <div className="flex justify-center gap-3 mb-8">
          {GAME_CONFIG.ASSETS.map((a) => (
            <div
              key={a.symbol}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {a.symbol}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="player-name-input"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Your Name
            </label>
            <input
              id="player-name-input"
              className="game-input"
              type="text"
              placeholder="e.g. Alex Trader"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="off"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-center text-negative">{error}</p>
          )}

          <button
            id="join-game-btn"
            type="submit"
            className="btn-primary mt-2"
            style={{ padding: "14px" }}
            disabled={loading || !name.trim()}
          >
            {loading ? "Joining..." : "🚀 Join the Game"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          Starting balance: <span className="mono font-semibold" style={{ color: "var(--accent-gold)" }}>
            $10,000
          </span>
        </p>

        {/* Admin Link shortcut */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Organizing the game?
          </p>
          <a
            href="/admin"
            className="text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: "var(--accent-blue)" }}
          >
            Open Teacher Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
