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
    return React.createElement("div", { "data-testid": `seller-actions-${sellerId}` }, status);
  },
}));

jest.mock("../../../../../src/components/AdminRemoveListing", () => ({
  __esModule: true,
  AdminRemoveListing: ({ productId, status }: { productId: string; status: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": `remove-listing-${productId}` }, status);
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

describe("admin_dashboard_loads_all_sellers", () => {
  const mockedRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
  const mockedDb = db as unknown as {
    sellerProfile: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    product: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAuth.mockResolvedValue({
      user: { id: "admin-001", role: "ADMIN" },
    } as never);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders all sellers with user info and product counts in descending created order", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([
      {
        id: "seller-103",
        storeName: "Carol Market",
        status: "PENDING",
        user: { name: "Carol", email: "carol@market.com" },
        _count: { products: 0 },
      },
      {
        id: "seller-101",
        storeName: "Alice Store",
        status: "APPROVED",
        user: { name: "Alice", email: "alice@store.com" },
        _count: { products: 2 },
      },
      {
        id: "seller-102",
        storeName: "Bob Shop",
        status: "APPROVED",
        user: { name: "Bob", email: "bob@shop.com" },
        _count: { products: 1 },
      },
    ]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(mockedRequireAuth).toHaveBeenCalledTimes(1);
    expect(mockedRequireAuth).toHaveBeenCalledWith(["ADMIN"]);
    expect(mockedDb.sellerProfile.findMany).toHaveBeenCalledTimes(1);
    expect(mockedDb.sellerProfile.findMany).toHaveBeenCalledWith({
      include: { user: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });
    expect(mockedDb.product.findMany).toHaveBeenCalledWith({
      include: { seller: true, category: true },
      orderBy: { createdAt: "desc" },
    });
    expect(mockedDb.sellerProfile.count).toHaveBeenNthCalledWith(1, {
      where: { status: "PENDING" },
    });
    expect(mockedDb.sellerProfile.count).toHaveBeenNthCalledWith(2, {
      where: { status: "SUSPENDED" },
    });

    expect(html).toContain("Admin panel");
    expect(html).toContain("carol@market.com");
    expect(html).toContain("alice@store.com");
    expect(html).toContain("bob@shop.com");
    expect(html).toContain("PENDING");
    expect(html).toContain("APPROVED");
    expect(html).toContain("Alice Store");
    expect(html).toContain("Bob Shop");
    expect(html).toContain("Carol Market");
    expect(html).toContain("<td class=\"py-3 pr-4\">2</td>");
    expect(html).toContain("<td class=\"py-3 pr-4\">1</td>");
    expect(html.indexOf("Carol Market")).toBeLessThan(html.indexOf("Alice Store"));
    expect(html.indexOf("Alice Store")).toBeLessThan(html.indexOf("Bob Shop"));
  });

  it("renders seller section even when there are no sellers", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Sellers");
    expect(html).toContain("All listings");
    expect(html).not.toContain("alice@store.com");
    expect(html).not.toContain("bob@shop.com");
  });
});
