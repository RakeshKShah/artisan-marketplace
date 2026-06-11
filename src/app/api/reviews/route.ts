import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  orderItemId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = schema.parse(await request.json());
    const item = await db.orderItem.findUnique({
      where: { id: data.orderItemId },
      include: { order: true, review: true },
    });

    if (!item || item.order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    if (!item.shippedAt) {
      return NextResponse.json({ error: "Item must be shipped before reviewing" }, { status: 400 });
    }

    if (item.review) {
      return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        orderItemId: data.orderItemId,
        productId: item.productId,
        buyerId: session.user.id,
        rating: data.rating,
        comment: data.comment,
      },
    });

    if (!item.deliveredAt) {
      await db.orderItem.update({
        where: { id: item.id },
        data: { deliveredAt: new Date() },
      });

      const orderItems = await db.orderItem.findMany({
        where: { orderId: item.orderId },
      });
      if (orderItems.every((oi) => oi.id === item.id || oi.deliveredAt)) {
        await db.order.update({
          where: { id: item.orderId },
          data: { status: "DELIVERED" },
        });
      }
    }

    return NextResponse.json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
