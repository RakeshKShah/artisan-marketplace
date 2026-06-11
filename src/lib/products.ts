import { ProductStatus, SellerStatus, Prisma } from "@/generated/prisma/client";

export const buyerVisibleProductWhere: Prisma.ProductWhereInput = {
  status: ProductStatus.ACTIVE,
  seller: {
    status: SellerStatus.APPROVED,
  },
};

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export const PLATFORM_FEE_PERCENT = 10;

export function calculateFees(totalCents: number) {
  const platformFeeCents = Math.round(totalCents * (PLATFORM_FEE_PERCENT / 100));
  const sellerEarningsCents = totalCents - platformFeeCents;
  return { platformFeeCents, sellerEarningsCents };
}
