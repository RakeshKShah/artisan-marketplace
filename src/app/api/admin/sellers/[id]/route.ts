import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PENDING", "APPROVED", "SUSPENDED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { status } = schema.parse(await request.json());
    const seller = await db.sellerProfile.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(seller);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
