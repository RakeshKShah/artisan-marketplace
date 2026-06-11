import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const orders = await db.order.findMany({
    where: { buyerId: session.user.id },
    include: {
      items: {
        include: { product: true, review: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Your orders</h1>

      {orders.length === 0 ? (
        <p className="mt-8 text-stone-500">No orders yet.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-stone-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Order #{order.id.slice(-8)}</p>
                  <p className="text-sm text-stone-500">
                    {order.createdAt.toLocaleDateString()} · {order.status}
                  </p>
                </div>
                <p className="font-semibold text-amber-900">
                  {formatPrice(order.totalCents)}
                </p>
              </div>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.product.title}
                      {item.shippedAt && !item.review && (
                        <Link
                          href={`/orders/${order.id}`}
                          className="ml-2 text-amber-800 hover:underline"
                        >
                          Leave review
                        </Link>
                      )}
                      {item.review && (
                        <span className="ml-2 text-green-700">Reviewed</span>
                      )}
                    </span>
                    <span>{formatPrice(item.priceCents * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/orders/${order.id}`}
                className="mt-4 inline-block text-sm text-amber-800 hover:underline"
              >
                View details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
