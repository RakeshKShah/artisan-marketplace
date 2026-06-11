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
  AdminSellerActions: ({ sellerId }: { sellerId: string }) => {
    const React = require("react");
    return React.createElement("div", null, sellerId);
  },
}));

jest.mock("../../../../../src/components/AdminRemoveListing", () => ({
  __esModule: true,
  AdminRemoveListing: ({ productId, status }: { productId: string; status: string }) => {
    const React = require("react");
    return React.createElement("div", null, `${productId}:${status}`);
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

describe("admin_dashboard_shows_suspended_sellers", () => {
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

  it("shows suspended sellers and their listings to admins with a suspended count", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([
      {
        id: "seller-301",
        storeName: "Suspended Store",
        status: "SUSPENDED",
        user: { name: "Sam", email: "sam@example.com" },
        _count: { products: 2 },
      },
      {
        id: "seller-302",
        storeName: "Approved Store",
        status: "APPROVED",
        user: { name: "Amy", email: "amy@example.com" },
        _count: { products: 1 },
      },
    ]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-301",
        title: "Suspended Product One",
        priceCents: 1200,
        status: "ACTIVE",
        seller: { id: "seller-301", storeName: "Suspended Store", status: "SUSPENDED" },
        category: { id: "cat-1", name: "General" },
      },
      {
        id: "prod-302",
        title: "Suspended Product Two",
        priceCents: 1800,
        status: "ACTIVE",
        seller: { id: "seller-301", storeName: "Suspended Store", status: "SUSPENDED" },
        category: { id: "cat-1", name: "General" },
      },
      {
        id: "prod-303",
        title: "Approved Product",
        priceCents: 2200,
        status: "ACTIVE",
        seller: { id: "seller-302", storeName: "Approved Store", status: "APPROVED" },
        category: { id: "cat-2", name: "Other" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Suspended Store");
    expect(html).toContain("SUSPENDED");
    expect(html).toContain("Suspended Product One");
    expect(html).toContain("Suspended Product Two");
    expect(html).toContain("Approved Product");
    expect(html).toContain("Includes listings from suspended sellers");
    expect(html).toContain(">1</p>");
  });

  it("highlights suspended seller listings with the suspended row styling", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-301",
        title: "Suspended Product One",
        priceCents: 1200,
        status: "ACTIVE",
        seller: { id: "seller-301", storeName: "Suspended Store", status: "SUSPENDED" },
        category: { id: "cat-1", name: "General" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("bg-red-50/50");
    expect(html).toContain("Suspended Product One");
  });
});
