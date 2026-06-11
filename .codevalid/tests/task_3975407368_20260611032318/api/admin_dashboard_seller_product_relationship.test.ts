jest.mock("../../../../../src/lib/session", () => ({
  __esModule: true,
  requireAuth: jest.fn(),
}));

jest.mock("../../../../../src/lib/db", () => ({
  __esModule: true,
  db: {
    sellerProfile: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => {
    const React = require("react");
    return React.createElement("a", { href }, children);
  },
}));

jest.mock("../../../../../src/components/AdminSellerActions", () => ({
  __esModule: true,
  AdminSellerActions: () => {
    const React = require("react");
    return React.createElement("div", null, "seller-actions");
  },
}));

jest.mock("../../../../../src/components/AdminRemoveListing", () => ({
  __esModule: true,
  AdminRemoveListing: () => {
    const React = require("react");
    return React.createElement("div", null, "remove");
  },
}));

jest.mock("../../../../../src/components/RunPayoutsButton", () => ({
  __esModule: true,
  RunPayoutsButton: () => {
    const React = require("react");
    return React.createElement("button", null, "Run payouts");
  },
}));

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminPage from "../../../../../src/app/admin/page";
import { requireAuth } from "../../../../../src/lib/session";
import { db } from "../../../../../src/lib/db";

describe("admin_dashboard_seller_product_relationship", () => {
  const mockedRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
  const mockedDb = db as unknown as {
    sellerProfile: { findMany: jest.Mock; count: jest.Mock };
    product: { findMany: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockResolvedValue({ user: { id: "admin-001", role: "ADMIN" } } as never);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders products with intact seller and category relationships for admin review", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([
      {
        id: "seller-501",
        storeName: "Verified Seller",
        status: "APPROVED",
        user: { name: "Verified Owner", email: "verified@seller.com" },
        _count: { products: 1 },
      },
    ]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-501",
        title: "Garden Tool Set",
        priceCents: 4999,
        status: "ACTIVE",
        seller: { id: "seller-501", storeName: "Verified Seller", status: "APPROVED" },
        category: { id: "cat-501", name: "Home & Garden" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("verified@seller.com");
    expect(html).toContain("Verified Seller");
    expect(html).toContain("Garden Tool Set");
    expect(html).toContain("Home &amp; Garden");
    expect(html).toContain("$49.99");
    expect(html).toContain("APPROVED");
  });

  it("renders the product link to the buyer-facing product details page", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-501",
        title: "Garden Tool Set",
        priceCents: 4999,
        status: "ACTIVE",
        seller: { id: "seller-501", storeName: "Verified Seller", status: "APPROVED" },
        category: { id: "cat-501", name: "Home & Garden" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain('href="/products/prod-501"');
  });
});
