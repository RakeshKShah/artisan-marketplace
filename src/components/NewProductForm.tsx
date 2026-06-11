"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NewProductFormProps = {
  categories: { id: string; name: string }[];
};

export function NewProductForm({ categories }: NewProductFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const priceCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Enter a valid price");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priceCents,
        stock: parseInt(stock, 10),
        categoryId,
        imageUrl,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create product");
      return;
    }

    router.push("/seller");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Price (USD)</label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Stock</label>
          <input
            type="number"
            required
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Image URL</label>
        <input
          type="url"
          required
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        />
        <p className="mt-1 text-xs text-stone-500">
          Use a direct image link (e.g. from Unsplash).
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-amber-800 py-3 font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {loading ? "Creating..." : "List product"}
      </button>
    </form>
  );
}
