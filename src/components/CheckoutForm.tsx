"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutFormProps = {
  defaultName: string;
};

export function CheckoutForm({ defaultName }: CheckoutFormProps) {
  const [shippingName, setShippingName] = useState(defaultName);
  const [shippingAddress, setShippingAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingName, shippingAddress }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Checkout failed");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      router.push(`/orders/${data.orderId}?success=1`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium text-stone-700">Full name</label>
        <input
          type="text"
          required
          value={shippingName}
          onChange={(e) => setShippingName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-stone-700">Shipping address</label>
        <textarea
          required
          rows={3}
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
          placeholder="Street, city, state, ZIP"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-amber-800 py-4 font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Place order"}
      </button>
    </form>
  );
}
