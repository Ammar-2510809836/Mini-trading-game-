"use client";
// components/student/TradePanel.tsx - Negotiated Trading Mode

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { GAME_CONFIG } from "@/lib/gameConfig";
import { formatUSD } from "@/lib/portfolioUtils";
import type { PortfolioSnapshot } from "@/lib/portfolioUtils";

interface TradePanelProps {
  playerId: string;
  selectedAsset: string;
  currentPrice: number; // For bubble games, this acts as the 'Reported' price
  currentTick: number;
  portfolio: PortfolioSnapshot;
  gameIsPlaying: boolean;
  onTrade: () => void;
}

export default function TradePanel({
  playerId,
  selectedAsset,
  currentPrice,
  currentTick,
  portfolio,
  gameIsPlaying,
  onTrade,
}: TradePanelProps) {
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>(currentPrice.toString());
  const [units, setUnits] = useState<string>("1");
  const [loading, setLoading] = useState<"BUY" | "SELL" | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const priceNum = parseFloat(negotiatedPrice) || 0;
  const unitsNum = parseFloat(units) || 0;
  const totalCost = priceNum * unitsNum;

  const holding = portfolio.holdings.find((h) => h.symbol === selectedAsset);
  const holdingUnits = holding ? holding.units : 0;
  const assetMeta = GAME_CONFIG.ASSETS.find((a) => a.symbol === selectedAsset);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function executeTrade(type: "BUY" | "SELL") {
    if (unitsNum <= 0) {
      showToast("Please enter a valid number of units.", "error");
      return;
    }
    if (priceNum <= 0) {
      showToast("Please enter a valid price.", "error");
      return;
    }

    if (type === "BUY" && totalCost > portfolio.cash) {
      showToast("Not enough cash!", "error");
      return;
    }
    if (type === "SELL" && unitsNum > holdingUnits) {
      showToast("You don't have enough units to sell!", "error");
      return;
    }

    setLoading(type);
    try {
      const { error } = await supabase.from("trades").insert({
        player_id:          playerId,
        asset_symbol:       selectedAsset,
        trade_type:         type,
        amount_usd:         totalCost,
        price_at_execution: priceNum,
        tick_executed:      currentTick,
      });
      if (error) throw error;
      showToast(`${type} executed: ${unitsNum} units at ${formatUSD(priceNum)}`, "success");
      onTrade();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Trade failed";
      showToast(msg, "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass-card p-6 flex flex-col gap-5 border border-white/5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
          Negotiated Trade
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xl">{assetMeta?.icon}</span>
          <span className="font-bold text-lg" style={{ color: assetMeta?.color }}>
            {selectedAsset}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Price Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>
            Agreed Price (€)
          </label>
          <input
            type="number"
            className="game-input text-lg py-3"
            value={negotiatedPrice}
            onChange={(e) => setNegotiatedPrice(e.target.value)}
          />
        </div>

        {/* Units Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>
            Quantity (Units)
          </label>
          <input
            type="number"
            className="game-input text-lg py-3"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Total Value:</span>
        <span className="font-bold mono text-lg" style={{ color: totalCost > portfolio.cash ? "var(--accent-red)" : "inherit" }}>
          {formatUSD(totalCost)}
        </span>
      </div>

      {/* Balances */}
      <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-2">
          <span>🏠 Cash:</span>
          <span className="text-white mono">{formatUSD(portfolio.cash)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📦 Holdings:</span>
          <span className="text-white mono">{holdingUnits.toFixed(1)} Units</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => executeTrade("BUY")}
          disabled={!gameIsPlaying || loading !== null || totalCost > portfolio.cash}
          className="btn-primary py-4 text-sm font-bold shadow-lg shadow-blue-500/10 active:scale-95 transition-transform"
        >
          {loading === "BUY" ? "Buying..." : "BUY SHARES"}
        </button>
        <button
          onClick={() => executeTrade("SELL")}
          disabled={!gameIsPlaying || loading !== null || unitsNum > holdingUnits}
          className="btn-primary py-4 text-sm font-bold shadow-lg shadow-red-500/10 active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)" }}
        >
          {loading === "SELL" ? "Selling..." : "SELL SHARES"}
        </button>
      </div>

      {toast && (
        <div className={`text-center text-xs font-bold p-3 rounded-xl fade-in ${toast.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {toast.msg}
        </div>
      )}

      {!gameIsPlaying && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
           <p className="text-center text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
            ⏸ Market Closed — Waiting for Teacher
          </p>
        </div>
      )}
    </div>
  );
}
