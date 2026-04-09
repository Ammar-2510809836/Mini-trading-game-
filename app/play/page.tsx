"use client";
// app/play/page.tsx — Student View

import { useState, useEffect } from "react";
import LoginForm from "@/components/student/LoginForm";
import Dashboard from "@/components/student/Dashboard";
import historicalPricesData from "@/data/historicalPrices.json";
import { GAME_CONFIG, type HistoricalEntry } from "@/lib/gameConfig";

const historicalPrices: HistoricalEntry[] = historicalPricesData as HistoricalEntry[];

export default function StudentPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore session from localStorage after hydration
  useEffect(() => {
    const storedId   = localStorage.getItem("player_id");
    const storedName = localStorage.getItem("player_name");
    if (storedId && storedName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlayerId(storedId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlayerName(storedName);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  function handleLogin(id: string, name: string) {
    setPlayerId(id);
    setPlayerName(name);
  }

  if (!hydrated) {
    // Prevent hydration mismatch — show nothing until client mounts
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-48 h-8 rounded-lg" />
      </div>
    );
  }

  if (!playerId || !playerName) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      playerId={playerId}
      playerName={playerName}
      historicalPrices={historicalPrices}
    />
  );
}
