"use client";

import { useState } from "react";

export function RunPayoutsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleClick() {
    setLoading(true);
    setResult("");
    const res = await fetch("/api/payouts/run", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(
        `Processed ${data.processed} payout(s) · ${data.demoMode ? "demo mode" : "transfers sent"}`,
      );
    } else {
      setResult(data.error ?? "Failed");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-stone-800 px-6 py-2 text-sm text-white hover:bg-stone-900 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run weekly payouts"}
      </button>
      {result && <p className="mt-2 text-sm text-stone-600">{result}</p>}
    </div>
  );
}
