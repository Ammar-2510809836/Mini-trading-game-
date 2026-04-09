"use client";
// components/student/Portfolio.tsx

import { formatUSD } from "@/lib/portfolioUtils";
import type { PortfolioSnapshot } from "@/lib/portfolioUtils";
import { GAME_CONFIG } from "@/lib/gameConfig";

interface PortfolioProps {
  portfolio: PortfolioSnapshot;
  currentPrices: Record<string, number>;
}

export default function Portfolio({ portfolio, currentPrices }: PortfolioProps) {
  const { cash, holdings, totalValue } = portfolio;
  const pnl = totalValue - GAME_CONFIG.INITIAL_WALLET_BALANCE;
  const pnlPct = (pnl / GAME_CONFIG.INITIAL_WALLET_BALANCE) * 100;
  const isPositive = pnl >= 0;

  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      {/* Total portfolio value */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          Total Portfolio Value
        </p>
        <p
          className="text-3xl font-bold mono gradient-text-gold"
          id="total-portfolio-value"
        >
          {formatUSD(totalValue)}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span
            className={`text-sm font-semibold ${isPositive ? "text-positive" : "text-negative"}`}
          >
            {isPositive ? "▲" : "▼"} {formatUSD(Math.abs(pnl))} ({isPositive ? "+" : ""}{pnlPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Cash & invested */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>💵 Cash</p>
          <p className="font-semibold mono text-sm" id="cash-display">{formatUSD(cash)}</p>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>📊 Invested</p>
          <p className="font-semibold mono text-sm">{formatUSD(totalValue - cash)}</p>
        </div>
      </div>

      {/* Holdings breakdown */}
      {holdings.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Holdings
          </p>
          <div className="flex flex-col gap-2">
            {holdings.map((h) => {
              const assetMeta = GAME_CONFIG.ASSETS.find((a) => a.symbol === h.symbol);
              const currentPrice = currentPrices[h.symbol] ?? 0;
              const marketVal = h.units * currentPrice;
              const costBasis = h.units * h.avgCost;
              const holdingPnl = marketVal - costBasis;
              const holdingPct = costBasis > 0 ? (holdingPnl / costBasis) * 100 : 0;

              return (
                <div
                  key={h.symbol}
                  className="flex items-center justify-between rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{assetMeta?.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{h.symbol}</p>
                      <p className="text-xs mono" style={{ color: "var(--text-muted)" }}>
                        {h.units.toFixed(6)} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold mono">{formatUSD(marketVal)}</p>
                    <p
                      className={`text-xs ${holdingPnl >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {holdingPnl >= 0 ? "+" : ""}{holdingPct.toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
