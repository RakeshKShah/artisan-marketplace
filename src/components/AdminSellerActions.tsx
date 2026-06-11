"use client";

import { useRouter } from "next/navigation";

type AdminSellerActionsProps = {
  sellerId: string;
  status: string;
};

export function AdminSellerActions({ sellerId, status }: AdminSellerActionsProps) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    await fetch(`/api/admin/sellers/${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "APPROVED" && (
        <button
          type="button"
          onClick={() => updateStatus("APPROVED")}
          className="rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800"
        >
          Approve
        </button>
      )}
      {status !== "SUSPENDED" && (
        <button
          type="button"
          onClick={() => updateStatus("SUSPENDED")}
          className="rounded-lg bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800"
        >
          Suspend
        </button>
      )}
      {status !== "PENDING" && (
        <button
          type="button"
          onClick={() => updateStatus("PENDING")}
          className="rounded-lg bg-stone-500 px-3 py-1.5 text-sm text-white hover:bg-stone-600"
        >
          Set pending
        </button>
      )}
    </div>
  );
}
