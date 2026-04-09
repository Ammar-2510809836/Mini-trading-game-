"use client";
// components/student/PriceChart.tsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GAME_CONFIG, type HistoricalEntry } from "@/lib/gameConfig";

interface PriceChartProps {
  data: HistoricalEntry[];
  selectedAsset: string;
  currentTick: number;
}

const ASSET_META: Record<string, { color: string; label: string; priceKey: string }> = {
  BTC:  { color: "#F7931A", label: "Bitcoin (BTC)",  priceKey: "BTC_price"  },
  Gold: { color: "#FFD700", label: "Gold",            priceKey: "Gold_price" },
  Oil:  { color: "#2ECC71", label: "Oil",             priceKey: "Oil_price"  },
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass-card"
      style={{ padding: "8px 14px", borderColor: "rgba(255,255,255,0.15)" }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-semibold mono text-sm">
        ${payload[0].value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function PriceChart({ data, selectedAsset, currentTick }: PriceChartProps) {
  const meta = ASSET_META[selectedAsset] ?? ASSET_META["BTC"];

  // Only show ticks up to current
  const visible = data.slice(0, currentTick + 1);

  const chartData = visible.map((row) => ({
    date: row.date,
    price: row[meta.priceKey as keyof HistoricalEntry] as number,
  }));

  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;

  const startPrice = chartData[0]?.price ?? 0;
  const endPrice   = chartData[chartData.length - 1]?.price ?? 0;
  const pctChange  = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
  const isPositive = pctChange >= 0;

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: meta.color }}
          />
          <span className="font-semibold text-sm">{meta.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="mono text-sm font-semibold"
            style={{ color: meta.color }}
          >
            ${endPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
          <span
            className={`text-xs font-medium ${isPositive ? "text-positive" : "text-negative"}`}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(pctChange).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length < 2 ? (
        <div
          className="flex items-center justify-center h-40 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Waiting for game to start...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id={`lineGrad-${selectedAsset}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.8} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#4a5568" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(v) => v?.slice(5)}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tick={{ fontSize: 10, fill: "#4a5568" }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={`url(#lineGrad-${selectedAsset})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: meta.color, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="text-right mt-2">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Day {currentTick} / {GAME_CONFIG.TOTAL_GAME_TICKS}
        </span>
      </div>
    </div>
  );
}
