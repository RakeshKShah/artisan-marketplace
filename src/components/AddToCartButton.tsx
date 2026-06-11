"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AddToCartButtonProps = {
  productId: string;
  disabled?: boolean;
};

export function AddToCartButton({ productId, disabled }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    setLoading(false);
    if (res.status === 401) {
      router.push("/auth/signin");
      return;
    }
    if (res.ok) router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="rounded-full bg-amber-800 px-8 py-3 font-medium text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300"
    >
      {loading ? "Adding..." : disabled ? "Sold out" : "Add to cart"}
    </button>
  );
}
