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
    return React.createElement("div", null, "actions");
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

describe("admin_dashboard_ordering_descending", () => {
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

  it("renders sellers and products in descending created order from the query results", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([
      {
        id: "seller-602",
        storeName: "Newest Seller",
        status: "APPROVED",
        user: { name: "New", email: "new@example.com" },
        _count: { products: 0 },
      },
      {
        id: "seller-603",
        storeName: "Middle Seller",
        status: "APPROVED",
        user: { name: "Mid", email: "mid@example.com" },
        _count: { products: 0 },
      },
      {
        id: "seller-601",
        storeName: "Oldest Seller",
        status: "APPROVED",
        user: { name: "Old", email: "old@example.com" },
        _count: { products: 2 },
      },
    ]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-602",
        title: "Newest Product",
        priceCents: 3000,
        status: "ACTIVE",
        seller: { id: "seller-601", storeName: "Oldest Seller", status: "APPROVED" },
        category: { id: "cat", name: "Category" },
      },
      {
        id: "prod-601",
        title: "Older Product",
        priceCents: 1500,
        status: "ACTIVE",
        seller: { id: "seller-601", storeName: "Oldest Seller", status: "APPROVED" },
        category: { id: "cat", name: "Category" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(mockedDb.sellerProfile.findMany).toHaveBeenCalledWith({
      include: { user: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });
    expect(mockedDb.product.findMany).toHaveBeenCalledWith({
      include: { seller: true, category: true },
      orderBy: { createdAt: "desc" },
    });
    expect(html.indexOf("Newest Seller")).toBeLessThan(html.indexOf("Middle Seller"));
    expect(html.indexOf("Middle Seller")).toBeLessThan(html.indexOf("Oldest Seller"));
    expect(html.indexOf("Newest Product")).toBeLessThan(html.indexOf("Older Product"));
  });

  it("preserves ordering when only one seller and one product are returned", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([
      {
        id: "seller-601",
        storeName: "Only Seller",
        status: "APPROVED",
        user: { name: "Only", email: "only@example.com" },
        _count: { products: 1 },
      },
    ]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-601",
        title: "Only Product",
        priceCents: 1000,
        status: "ACTIVE",
        seller: { id: "seller-601", storeName: "Only Seller", status: "APPROVED" },
        category: { id: "cat", name: "Category" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Only Seller");
    expect(html).toContain("Only Product");
  });
});
