import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.string(),
  imageUrl: z.string().url(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seller = await db.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!seller || seller.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Your seller account must be approved before listing products" },
      { status: 403 },
    );
  }

  try {
    const data = schema.parse(await request.json());
    const product = await db.product.create({
      data: { ...data, sellerId: seller.id },
    });
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
