"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export function SignUpForm() {
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        storeName: role === "SELLER" ? storeName : undefined,
        bio: role === "SELLER" ? bio : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Signup failed");
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push(role === "SELLER" ? "/seller" : "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div className="flex gap-2 rounded-lg bg-stone-100 p-1">
        {(["BUYER", "SELLER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              role === r ? "bg-white text-amber-900 shadow" : "text-stone-600"
            }`}
          >
            {r === "BUYER" ? "I want to buy" : "I want to sell"}
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
        />
      </div>

      {role === "SELLER" && (
        <>
          <div>
            <label className="text-sm font-medium">Store name</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-3"
              placeholder="Tell buyers about your craft..."
            />
          </div>
          <p className="text-sm text-amber-800">
            New seller accounts require admin approval before you can list products.
          </p>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-amber-800 py-3 font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
