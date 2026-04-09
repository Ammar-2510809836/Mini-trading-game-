"use client";
// components/admin/QRCodeDisplay.tsx

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeDisplay() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    // Build student URL from current window origin
    const origin = window.location.origin;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(origin + "/play");
  }, []);

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 w-full">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(139,92,246,0.15)" }}
        >
          📱
        </div>
        <div>
          <h2 className="font-bold text-lg">Join the Game</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Students scan to join on their phones
          </p>
        </div>
      </div>

      {url ? (
        <div
          className="p-4 rounded-2xl"
          style={{ background: "white" }}
        >
          <QRCodeCanvas
            id="student-qr-code"
            value={url}
            size={180}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0a0e1a"
          />
        </div>
      ) : (
        <div className="shimmer w-[180px] h-[180px] rounded-2xl" />
      )}

      <div className="text-center">
        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Student URL</p>
        <p
          className="text-sm font-mono font-semibold break-all"
          style={{ color: "var(--accent-blue)" }}
        >
          {url || "Loading..."}
        </p>
      </div>
    </div>
  );
}
