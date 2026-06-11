import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const seller = await db.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!seller) {
    return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
  }

  const item = await db.orderItem.findFirst({
    where: { id, sellerId: seller.id },
    include: { order: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  if (item.order.status !== "PAID" && item.order.status !== "SHIPPED") {
    return NextResponse.json({ error: "Order not ready to ship" }, { status: 400 });
  }

  await db.orderItem.update({
    where: { id },
    data: { shippedAt: new Date() },
  });

  const allItems = await db.orderItem.findMany({ where: { orderId: item.orderId } });
  const allShipped = allItems.every((i) => i.id === id || i.shippedAt);

  if (allShipped) {
    await db.order.update({
      where: { id: item.orderId },
      data: { status: "SHIPPED" },
    });
  }

  return NextResponse.json({ success: true });
}
