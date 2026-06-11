"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ShipButtonProps = {
  orderItemId: string;
  shipped: boolean;
};

export function ShipButton({ orderItemId, shipped }: ShipButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (shipped) {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
        Shipped
      </span>
    );
  }

  async function handleShip() {
    setLoading(true);
    await fetch(`/api/seller/orders/${orderItemId}/ship`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleShip}
      disabled={loading}
      className="rounded-full bg-amber-800 px-4 py-2 text-sm text-white hover:bg-amber-900 disabled:opacity-50"
    >
      {loading ? "Marking..." : "Mark shipped"}
    </button>
  );
}
