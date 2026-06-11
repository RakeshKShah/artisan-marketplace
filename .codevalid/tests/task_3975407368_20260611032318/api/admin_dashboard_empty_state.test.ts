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
    return React.createElement("div", null, "remove-listing");
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

describe("admin_dashboard_empty_state", () => {
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

  it("renders successfully when there are no sellers or products", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    expect(html).toContain("Admin panel");
    expect(html).toContain("Sellers");
    expect(html).toContain("All listings");
    expect(html).toContain("Pending approval");
    expect(html).toContain("Suspended sellers");
    expect(html).toContain("Total listings");
    expect(mockedDb.sellerProfile.findMany).toHaveBeenCalledTimes(1);
    expect(mockedDb.product.findMany).toHaveBeenCalledTimes(1);
    expect(mockedDb.sellerProfile.count).toHaveBeenCalledTimes(2);
  });

  it("shows zero for pending, suspended, and total listing metrics in the empty state", async () => {
    mockedDb.sellerProfile.findMany.mockResolvedValue([]);
    mockedDb.product.findMany.mockResolvedValue([]);
    mockedDb.sellerProfile.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const element = await AdminPage();
    const html = renderToStaticMarkup(element as React.ReactElement);

    const zeroCountOccurrences = (html.match(/>0<\/p>/g) || []).length;
    expect(zeroCountOccurrences).toBe(3);
  });
});
