"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type SearchBarProps = {
  categories: { id: string; name: string; slug: string }[];
};

export function SearchBar({ categories }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`/?${params.toString()}`);
  }

  function handleCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(`/?${params.toString()}`);
  }

  const activeCategory = searchParams.get("category") ?? "";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search handmade goods..."
          className="flex-1 rounded-full border border-stone-300 px-5 py-3 text-stone-800 outline-none focus:border-amber-600"
        />
        <button
          type="submit"
          className="rounded-full bg-amber-800 px-6 py-3 font-medium text-white hover:bg-amber-900"
        >
          Search
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategory("")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            !activeCategory
              ? "bg-amber-800 text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategory(cat.slug)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              activeCategory === cat.slug
                ? "bg-amber-800 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
