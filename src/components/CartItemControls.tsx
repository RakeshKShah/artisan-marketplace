"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CartItemControlsProps = {
  productId: string;
  quantity: number;
  maxStock: number;
};

export function CartItemControls({
  productId,
  quantity,
  maxStock,
}: CartItemControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateQty(newQty: number) {
    setLoading(true);
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: newQty }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={loading || quantity <= 1}
        onClick={() => updateQty(quantity - 1)}
        className="h-8 w-8 rounded-full border border-stone-300 hover:bg-stone-50 disabled:opacity-40"
      >
        −
      </button>
      <span>{quantity}</span>
      <button
        type="button"
        disabled={loading || quantity >= maxStock}
        onClick={() => updateQty(quantity + 1)}
        className="h-8 w-8 rounded-full border border-stone-300 hover:bg-stone-50 disabled:opacity-40"
      >
        +
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => updateQty(0)}
        className="text-sm text-red-600 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
