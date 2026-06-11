import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { ShipButton } from "@/components/ShipButton";

export default async function SellerDashboardPage() {
  const session = await requireAuth(["SELLER"]);

  const seller = await db.sellerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      products: { orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 10 },
      orderItems: {
        include: {
          product: true,
          order: { include: { buyer: true } },
        },
        orderBy: { order: { createdAt: "desc" } },
        take: 20,
      },
    },
  });

  if (!seller) {
    return <p className="p-10 text-center">Seller profile not found.</p>;
  }

  const statusBanner = {
    PENDING: {
      bg: "bg-amber-50 text-amber-900",
      text: "Your account is pending approval. You cannot list products until an admin approves your shop.",
    },
    APPROVED: {
      bg: "bg-green-50 text-green-900",
      text: "Your shop is live! Buyers can see your listings.",
    },
    SUSPENDED: {
      bg: "bg-red-50 text-red-900",
      text: "Your account is suspended. Your listings are hidden from buyers.",
    },
  }[seller.status];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-stone-900">{seller.storeName}</h1>
          <p className="mt-2 max-w-xl text-stone-600">{seller.bio}</p>
        </div>
        {seller.status === "APPROVED" && (
          <Link
            href="/seller/products/new"
            className="rounded-full bg-amber-800 px-6 py-3 font-medium text-white hover:bg-amber-900"
          >
            Add product
          </Link>
        )}
      </div>

      <div className={`mt-6 rounded-xl px-4 py-3 ${statusBanner.bg}`}>
        {statusBanner.text}
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-stone-900">Notifications</h2>
        {seller.notifications.length === 0 ? (
          <p className="mt-4 text-stone-500">No notifications yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {seller.notifications.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border px-4 py-3 ${
                  n.read ? "border-stone-100 bg-white" : "border-amber-200 bg-amber-50"
                }`}
              >
                {n.message}
                <span className="ml-2 text-xs text-stone-400">
                  {n.createdAt.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-stone-900">Orders to fulfill</h2>
        {seller.orderItems.length === 0 ? (
          <p className="mt-4 text-stone-500">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Buyer</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Earnings</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {seller.orderItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="py-3 pr-4">{item.product.title}</td>
                    <td className="py-3 pr-4">{item.order.buyer.name}</td>
                    <td className="py-3 pr-4">{item.quantity}</td>
                    <td className="py-3 pr-4">
                      {formatPrice(item.sellerEarningsCents)}
                    </td>
                    <td className="py-3">
                      <ShipButton orderItemId={item.id} shipped={!!item.shippedAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-stone-900">Your products</h2>
        {seller.products.length === 0 ? (
          <p className="mt-4 text-stone-500">No products listed.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seller.products.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
                <h3 className="font-medium">{p.title}</h3>
                <p className="text-sm text-stone-500">
                  {formatPrice(p.priceCents)} · {p.stock} in stock · {p.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
