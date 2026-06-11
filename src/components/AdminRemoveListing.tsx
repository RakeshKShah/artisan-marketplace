"use client";

import { useRouter } from "next/navigation";

type AdminRemoveListingProps = {
  productId: string;
  status: string;
};

export function AdminRemoveListing({ productId, status }: AdminRemoveListingProps) {
  const router = useRouter();

  if (status === "REMOVED") {
    return <span className="text-sm text-red-600">Removed</span>;
  }

  async function handleRemove() {
    if (!confirm("Remove this listing? It will disappear from the buyer storefront.")) return;
    await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      className="rounded-lg bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800"
    >
      Remove listing
    </button>
  );
}
