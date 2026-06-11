import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
  });

  if (!cart?.items.length) redirect("/cart");

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Checkout</h1>
      <p className="mt-2 text-stone-600">
        Order total: <strong>{formatPrice(total)}</strong>
      </p>
      <p className="mt-1 text-sm text-stone-500">
        Payments processed via Stripe. Sellers receive weekly payouts; Artisan Market takes a 10% fee.
      </p>
      <CheckoutForm defaultName={session.user.name} />
    </div>
  );
}
