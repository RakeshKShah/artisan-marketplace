import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { notFound, redirect } from "next/navigation";
import { ReviewForm } from "@/components/ReviewForm";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  const { success } = await searchParams;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true, review: true },
      },
    },
  });

  if (!order || order.buyerId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">
        Order #{order.id.slice(-8)}
      </h1>
      {success && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-green-800">
          Thank you! Your order has been placed.
        </p>
      )}
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <p>
          <span className="text-stone-500">Status:</span> {order.status}
        </p>
        <p className="mt-2">
          <span className="text-stone-500">Ship to:</span> {order.shippingName}
        </p>
        <p className="mt-1 text-stone-600">{order.shippingAddress}</p>
        <p className="mt-4 text-xl font-semibold text-amber-900">
          Total: {formatPrice(order.totalCents)}
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-medium">
              {item.quantity}x {item.product.title}
            </h2>
            <p className="text-sm text-stone-500">
              {formatPrice(item.priceCents * item.quantity)}
              {item.shippedAt
                ? ` · Shipped ${item.shippedAt.toLocaleDateString()}`
                : " · Awaiting shipment"}
            </p>
            {item.shippedAt && !item.review && (
              <div className="mt-4">
                <ReviewForm orderItemId={item.id} />
              </div>
            )}
            {item.review && (
              <div className="mt-4 rounded-lg bg-stone-50 p-4">
                <p className="text-amber-800">{"★".repeat(item.review.rating)}</p>
                <p className="mt-1 text-stone-600">{item.review.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
