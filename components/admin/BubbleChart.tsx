"use client";
// components/admin/BubbleChart.tsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GAME_CONFIG } from "@/lib/gameConfig";
import { useEffect, useState } from "react";
import { supabase, type Trade } from "@/lib/supabaseClient";

interface BubbleData {
  round: string;
  "Market Price (Avg)": number | null;
  "Fundamental Value": number;
}

export default function BubbleChart() {
  const [data, setData] = useState<BubbleData[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch all trades to calculate average prices per round
      const { data: trades } = await supabase.from("trades").select("*");
      
      const chartPoints = [];
      const totalRounds = 10;

      for (let i = 0; i < totalRounds; i++) {
        const roundTrades = (trades || []).filter((t: Trade) => t.tick_executed === i);
        const avgPrice = roundTrades.length > 0 
          ? roundTrades.reduce((sum, t) => sum + t.price_at_execution, 0) / roundTrades.length 
          : null;

        chartPoints.push({
          round: `R${i + 1}`,
          "Market Price (Avg)": avgPrice,
          "Fundamental Value": GAME_CONFIG.getFundamentalValue(i),
        });
      }
      setData(chartPoints);
    }

    fetchData();
    // Refresh when trades change
    const channel = supabase.channel("bubble-chart-refresh").on(
      "postgres_changes", 
      { event: "*", schema: "public", table: "trades" }, 
      fetchData
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Bubble Analysis</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Comparing Student Prices vs. Mathematical Fair Value
          </p>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-blue-500" />
             <span>Market Price</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-purple-500 opacity-50" />
             <span style={{ color: "var(--text-muted)" }}>Fundamental Value</span>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="round" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "var(--text-muted)", fontSize: 12 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip 
              contentStyle={{ background: "#111827", borderColor: "#374151", borderRadius: "12px" }}
              itemStyle={{ fontSize: "12px" }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            {/* The "Fair" Fundamental Value Line */}
            <Line 
              type="monotone" 
              dataKey="Fundamental Value" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              opacity={0.6}
            />

            {/* The Actual "Student" Market Price Line */}
            <Line 
              type="monotone" 
              dataKey="Market Price (Avg)" 
              stroke="#3b82f6" 
              strokeWidth={4}
              dot={{ r: 4, strokeWidth: 2, fill: "#0a0e1a" }}
              activeDot={{ r: 8 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <span className="font-bold text-blue-400">Debrief Tip:</span> If the <span className="text-white">Blue Line</span> stays above the <span className="text-purple-400 font-bold">Dashed Line</span>, a bubble existed. Usually, prices crash toward the Fundamental Value in the final rounds as dividends exhaust.
        </p>
      </div>
    </div>
  );
}
