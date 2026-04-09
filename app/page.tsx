"use client";
// app/page.tsx — Landing Page

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Background */}
      <div className="absolute inset-0 -z-10 bg-[#0a0e1a]">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(circle, #3b82f6, #8b5cf6)" }}
        />
      </div>

      <div className="max-w-4xl w-full text-center fade-in">
        <div className="text-6xl mb-6">📈</div>
        <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
          Mini Trading Game
        </h1>
        <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          A real-time classroom trading simulation. Test your market skills and compete for the top portfolio!
        </p>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto">
          {/* Player Option */}
          <Link 
            href="/play"
            className="glass-card p-10 flex flex-col items-center gap-6 hover:scale-[1.02] transition-all duration-300 group ring-1 ring-white/10 hover:ring-blue-500/50"
          >
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center text-4xl group-hover:bg-blue-500/20 transition-colors">
              🚀
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Join as Player</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Scan the QR code or enter your name to start trading assets.
              </p>
            </div>
            <div className="btn-primary w-full mt-auto">
              Start Trading
            </div>
          </Link>

          {/* Admin Option */}
          <Link 
            href="/admin"
            className="glass-card p-10 flex flex-col items-center gap-6 hover:scale-[1.02] transition-all duration-300 group ring-1 ring-white/10 hover:ring-purple-500/50"
          >
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center text-4xl group-hover:bg-purple-500/20 transition-colors">
              👑
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Teacher Dashboard</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Host the game, control the market, and view the live leaderboard.
              </p>
            </div>
            <div 
              className="btn-primary w-full mt-auto"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)" }}
            >
              Open Dashboard
            </div>
          </Link>
        </div>

        <div className="mt-16 text-sm" style={{ color: "var(--text-muted)" }}>
          Built with Next.js, Supabase & Recharts
        </div>
      </div>
    </div>
  );
}
