import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripeConfigured, stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  const session = await auth();

  const isAdmin = session?.user?.role === "ADMIN";
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setHours(0, 0, 0, 0);
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 7);

  const unpaidItems = await db.orderItem.findMany({
    where: {
      payoutId: null,
      shippedAt: { not: null },
      order: {
        status: { in: ["SHIPPED", "DELIVERED", "PAID"] },
        createdAt: { lt: weekEnd },
      },
    },
    include: { seller: true },
  });

  const bySeller = new Map<string, typeof unpaidItems>();
  for (const item of unpaidItems) {
    const list = bySeller.get(item.sellerId) ?? [];
    list.push(item);
    bySeller.set(item.sellerId, list);
  }

  const payouts = [];

  for (const [sellerId, items] of bySeller) {
    const amountCents = items.reduce((s, i) => s + i.sellerEarningsCents, 0);
    const platformFeeCents = items.reduce((s, i) => s + i.platformFeeCents, 0);
    const seller = items[0].seller;

    let stripeTransferId: string | undefined;

    if (isStripeConfigured() && seller.stripeAccountId && amountCents > 0) {
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: "usd",
        destination: seller.stripeAccountId,
        description: `Weekly payout ${weekStart.toISOString().slice(0, 10)}`,
      });
      stripeTransferId = transfer.id;
    }

    const payout = await db.payout.create({
      data: {
        sellerId,
        amountCents,
        platformFeeCents,
        status: stripeTransferId ? "PAID" : "PENDING",
        weekStart,
        weekEnd,
        stripeTransferId,
        orderItems: { connect: items.map((i) => ({ id: i.id })) },
      },
    });

    payouts.push(payout);
  }

  return NextResponse.json({
    processed: payouts.length,
    totalAmountCents: payouts.reduce((s, p) => s + p.amountCents, 0),
    demoMode: !isStripeConfigured(),
  });
}
