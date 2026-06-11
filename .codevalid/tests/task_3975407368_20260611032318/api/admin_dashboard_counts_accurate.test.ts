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

describe("admin_dashboard_counts_accurate", () => {
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

  it("shows accurate pending and suspended seller counts", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(mockedDb.sellerProfile.count).toHaveBeenCalledTimes(2);
    expect(mockedDb.sellerProfile.count).toHaveBeenNthCalledWith(1, {
      where: { status: "PENDING" },
    });
    expect(mockedDb.sellerProfile.count).toHaveBeenNthCalledWith(2, {
      where: { status: "SUSPENDED" },
    });
    expect(html).toContain("Pending approval");
    expect(html).toContain("Suspended sellers");
    expect(html).toContain(">3</p>");
    expect(html).toContain(">2</p>");
  });

  it("renders zero counts without crashing when all aggregates are empty", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Pending approval");
    expect(html).toContain("Suspended sellers");
    expect(html).toContain(">0</p>");
  });
});
