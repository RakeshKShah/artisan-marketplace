import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buyerVisibleProductWhere, calculateFees } from "@/lib/products";
import { isStripeConfigured, stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shippingName, shippingAddress } = await request.json();

  const cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: { include: { seller: true } } },
      },
    },
  });

  if (!cart?.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  for (const item of cart.items) {
    const available = await db.product.findFirst({
      where: {
        id: item.productId,
        ...buyerVisibleProductWhere,
        stock: { gte: item.quantity },
      },
    });
    if (!available) {
      return NextResponse.json(
        { error: `${item.product.title} is no longer available` },
        { status: 400 },
      );
    }
  }

  const totalCents = cart.items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: session.user.id,
        totalCents,
        shippingName,
        shippingAddress,
        status: "PENDING",
        items: {
          create: cart.items.map((item) => {
            const lineTotal = item.product.priceCents * item.quantity;
            const { platformFeeCents, sellerEarningsCents } = calculateFees(lineTotal);
            return {
              productId: item.productId,
              sellerId: item.product.sellerId,
              quantity: item.quantity,
              priceCents: item.product.priceCents,
              platformFeeCents,
              sellerEarningsCents,
            };
          }),
        },
      },
      include: { items: { include: { product: true, seller: true } } },
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.notification.create({
        data: {
          sellerId: item.product.sellerId,
          type: "NEW_ORDER",
          message: `New order for ${item.quantity}x ${item.product.title}`,
          orderId: created.id,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  if (!isStripeConfigured()) {
    await db.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });
    return NextResponse.json({
      orderId: order.id,
      demoMode: true,
      message: "Order placed (demo mode — add Stripe keys for real payments)",
    });
  }

  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.product.title,
        description: `Sold by ${item.seller.storeName}`,
      },
      unit_amount: item.priceCents,
    },
    quantity: item.quantity,
  }));

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email,
    line_items: lineItems,
    success_url: `${process.env.NEXTAUTH_URL}/orders/${order.id}?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
    metadata: { orderId: order.id },
    payment_intent_data: {
      application_fee_amount: order.items.reduce((s, i) => s + i.platformFeeCents, 0),
      transfer_data: undefined,
    },
  });

  await db.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url, orderId: order.id });
}
