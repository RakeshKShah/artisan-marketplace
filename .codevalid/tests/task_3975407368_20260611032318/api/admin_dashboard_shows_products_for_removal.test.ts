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
  AdminRemoveListing: ({ productId, status }: { productId: string; status: string }) => {
    const React = require("react");
    return React.createElement("button", { "data-product-id": productId }, status);
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

describe("admin_dashboard_shows_products_for_removal", () => {
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

  it("renders all products including rule-violating ones with seller and category details", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-401",
        title: "Prohibited Item",
        priceCents: 9900,
        status: "ACTIVE",
        seller: { id: "seller-401", storeName: "Seller 401", status: "APPROVED" },
        category: { id: "cat-001", name: "Electronics" },
      },
      {
        id: "prod-402",
        title: "Normal Item",
        priceCents: 1599,
        status: "ACTIVE",
        seller: { id: "seller-401", storeName: "Seller 401", status: "APPROVED" },
        category: { id: "cat-001", name: "Electronics" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(mockedDb.product.findMany).toHaveBeenCalledWith({
      include: { seller: true, category: true },
      orderBy: { createdAt: "desc" },
    });
    expect(html).toContain("Prohibited Item");
    expect(html).toContain("Normal Item");
    expect(html).toContain("Seller 401");
    expect(html).toContain("Electronics");
    expect(html).toContain("ACTIVE");
    expect(html).toContain("$99.00");
    expect(html).toContain("$15.99");
    expect(html).toContain("All listings");
  });

  it("shows total listings metric based on the product array length", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([
      {
        id: "prod-401",
        title: "Prohibited Item",
        priceCents: 9900,
        status: "ACTIVE",
        seller: { id: "seller-401", storeName: "Seller 401", status: "APPROVED" },
        category: { id: "cat-001", name: "Electronics" },
      },
      {
        id: "prod-402",
        title: "Normal Item",
        priceCents: 1599,
        status: "ACTIVE",
        seller: { id: "seller-401", storeName: "Seller 401", status: "APPROVED" },
        category: { id: "cat-001", name: "Electronics" },
      },
    ]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Total listings");
    expect(html).toContain(">2</p>");
  });
});
