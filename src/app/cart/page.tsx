import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { redirect } from "next/navigation";
import { CartItemControls } from "@/components/CartItemControls";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: { include: { seller: true } } },
      },
    },
  });

  const items = cart?.items ?? [];
  const total = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-stone-500">Your cart is empty.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-amber-800 hover:underline"
          >
            Continue browsing
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h2 className="font-medium">{item.product.title}</h2>
                    <p className="text-sm text-stone-500">
                      {item.product.seller.storeName}
                    </p>
                  </div>
                  <CartItemControls
                    productId={item.productId}
                    quantity={item.quantity}
                    maxStock={item.product.stock}
                  />
                </div>
                <p className="font-medium text-amber-900">
                  {formatPrice(item.product.priceCents * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-semibold text-amber-900">
              {formatPrice(total)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-amber-800 py-4 text-center font-medium text-white hover:bg-amber-900"
          >
            Proceed to checkout
          </Link>
        </>
      )}
    </div>
  );
}
