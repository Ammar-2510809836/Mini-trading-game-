// lib/portfolioUtils.ts
// Pure calculation helpers — no Supabase or React imports.

import type { Trade } from "./supabaseClient";
import { GAME_CONFIG } from "./gameConfig";

export interface Holding {
  symbol: string;
  units: number;      // how many units the player owns
  avgCost: number;    // average cost basis (USD per unit)
}

export interface PortfolioSnapshot {
  cash: number;
  holdings: Holding[];
  totalValue: number; // cash + market value of all holdings
}

type PriceMap = Record<string, number>; // { BTC: 95000, Gold: 2650, Oil: 74 }

/**
 * Replay all of a player's trades to compute their current portfolio.
 * @param trades  - All trades for this player, in chronological order
 * @param currentPrices - Market price for each asset at the current tick
 */
export function calcPortfolio(
  trades: Trade[],
  currentPrices: PriceMap
): PortfolioSnapshot {
  let cash = GAME_CONFIG.INITIAL_WALLET_BALANCE;
  const holdingsMap: Record<string, { units: number; totalCost: number }> = {};

  // Initialize all known assets with starting units
  for (const asset of GAME_CONFIG.ASSETS) {
    holdingsMap[asset.symbol] = { 
      units: GAME_CONFIG.INITIAL_ASSET_UNITS, 
      totalCost: 0 // initial assets are 'free' or base value
    };
  }

  // Replay trades in order
  for (const trade of trades) {
    const { asset_symbol, trade_type, amount_usd, price_at_execution } = trade;
    const unitsTraded = amount_usd / price_at_execution;

    if (trade_type === "BUY") {
      cash -= amount_usd;
      holdingsMap[asset_symbol] ??= { units: 0, totalCost: 0 };
      holdingsMap[asset_symbol].units += unitsTraded;
      holdingsMap[asset_symbol].totalCost += amount_usd;
    } else {
      // SELL
      cash += amount_usd;
      if (holdingsMap[asset_symbol]) {
        const fractionSold =
          unitsTraded / (holdingsMap[asset_symbol].units || 1);
        const costBasisSold =
          holdingsMap[asset_symbol].totalCost * fractionSold;
        holdingsMap[asset_symbol].units = Math.max(
          0,
          holdingsMap[asset_symbol].units - unitsTraded
        );
        holdingsMap[asset_symbol].totalCost = Math.max(
          0,
          holdingsMap[asset_symbol].totalCost - costBasisSold
        );
      }
    }
  }

  const holdings: Holding[] = Object.entries(holdingsMap)
    .filter(([, v]) => v.units > 0.000001)
    .map(([symbol, { units, totalCost }]) => ({
      symbol,
      units,
      avgCost: units > 0 ? totalCost / units : 0,
    }));

  const marketValue = holdings.reduce((sum, h) => {
    const price = currentPrices[h.symbol] ?? 0;
    return sum + h.units * price;
  }, 0);

  return {
    cash: Math.max(0, cash),
    holdings,
    totalValue: Math.max(0, cash) + marketValue,
  };
}

/** Format a number as USD currency string */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a percentage change with sign */
export function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
