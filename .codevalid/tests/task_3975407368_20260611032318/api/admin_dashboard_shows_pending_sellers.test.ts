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
  AdminSellerActions: ({ sellerId, status }: { sellerId: string; status: string }) => {
    const React = require("react");
    return React.createElement("div", null, `${sellerId}:${status}`);
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
    return React.createElement("button", { type: "button" }, "Run payouts");
  },
}));

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminPage from "../../../../../src/app/admin/page";
import { requireAuth } from "../../../../../src/lib/session";
import { db } from "../../../../../src/lib/db";

describe("admin_dashboard_shows_pending_sellers", () => {
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

  it("shows pending sellers in the dashboard and displays an accurate pending count", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([
      {
        id: "seller-201",
        storeName: "Pending One",
        status: "PENDING",
        user: { name: "Penny", email: "pending1@example.com" },
        _count: { products: 0 },
      },
      {
        id: "seller-202",
        storeName: "Pending Two",
        status: "PENDING",
        user: { name: "Paul", email: "pending2@example.com" },
        _count: { products: 0 },
      },
      {
        id: "seller-203",
        storeName: "Approved Seller",
        status: "APPROVED",
        user: { name: "Ava", email: "approved@example.com" },
        _count: { products: 3 },
      },
    ]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(2).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Pending One");
    expect(html).toContain("Pending Two");
    expect(html).toContain("PENDING");
    expect(html).toContain(">2</p>");
    expect(mockedDb.sellerProfile.count).toHaveBeenNthCalledWith(1, {
      where: { status: "PENDING" },
    });
  });

  it("still renders with zero pending sellers when pending count is zero", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([
      {
        id: "seller-203",
        storeName: "Approved Seller",
        status: "APPROVED",
        user: { name: "Ava", email: "approved@example.com" },
        _count: { products: 1 },
      },
    ]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Approved Seller");
    expect(html).not.toContain("Pending One");
    expect(html).toContain("Pending approval");
    expect(html).toContain(">0</p>");
  });
});
