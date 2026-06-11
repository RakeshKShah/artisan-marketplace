import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buyerVisibleProductWhere } from "@/lib/products";

async function getOrCreateCart(userId: string) {
  return db.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { seller: true, category: true },
          },
        },
      },
    },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await getOrCreateCart(session.user.id);
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, quantity = 1 } = await request.json();
  const product = await db.product.findFirst({
    where: { id: productId, ...buyerVisibleProductWhere, stock: { gt: 0 } },
  });

  if (!product) {
    return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
  }

  const cart = await getOrCreateCart(session.user.id);
  const existing = cart.items.find((i) => i.productId === productId);

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stock) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    if (quantity > product.stock) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    await db.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  const updated = await getOrCreateCart(session.user.id);
  return NextResponse.json(updated);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, quantity } = await request.json();
  const cart = await getOrCreateCart(session.user.id);
  const item = cart.items.find((i) => i.productId === productId);

  if (!item) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    if (quantity > item.product.stock) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }

  const updated = await getOrCreateCart(session.user.id);
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await request.json();
  const cart = await getOrCreateCart(session.user.id);
  const item = cart.items.find((i) => i.productId === productId);

  if (item) {
    await db.cartItem.delete({ where: { id: item.id } });
  }

  const updated = await getOrCreateCart(session.user.id);
  return NextResponse.json(updated);
}
