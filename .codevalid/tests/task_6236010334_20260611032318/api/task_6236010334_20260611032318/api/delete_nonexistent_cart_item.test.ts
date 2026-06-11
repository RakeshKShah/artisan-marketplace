jest.mock("@/lib/auth", () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  __esModule: true,
  db: {
    cart: {
      upsert: jest.fn(),
    },
    cartItem: {
      delete: jest.fn(),
    },
  },
}));

import { DELETE } from "../../src/app/api/cart/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

describe("delete_nonexistent_cart_item", () => {
  const mockedAuth = auth as jest.MockedFunction<typeof auth>;
  const mockedDb = db as {
    cart: { upsert: jest.Mock };
    cartItem: { delete: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns 200 with the unchanged cart when the requested product is not present", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-7", email: "buyer@example.com", name: "Buyer", role: "BUYER" },
    } as any);

    const cart = {
      id: "cart-7",
      userId: "user-7",
      items: [],
    };

    mockedDb.cart.upsert.mockResolvedValueOnce(cart).mockResolvedValueOnce(cart);

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "nonexistent-cart-item-99" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(cart);
    expect(mockedDb.cart.upsert).toHaveBeenCalledTimes(2);
    expect(mockedDb.cartItem.delete).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no active session", async () => {
    mockedAuth.mockResolvedValue(null as any);

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "nonexistent-cart-item-99" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockedDb.cart.upsert).not.toHaveBeenCalled();
    expect(mockedDb.cartItem.delete).not.toHaveBeenCalled();
  });

  it("deletes the matching item when the product is actually present", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-7", email: "buyer@example.com", name: "Buyer", role: "BUYER" },
    } as any);

    mockedDb.cart.upsert
      .mockResolvedValueOnce({
        id: "cart-7",
        userId: "user-7",
        items: [
          {
            id: "cart-item-99",
            productId: "nonexistent-cart-item-99",
            quantity: 1,
            product: { stock: 2, seller: {}, category: {} },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "cart-7",
        userId: "user-7",
        items: [],
      });
    mockedDb.cartItem.delete.mockResolvedValue({ id: "cart-item-99" });

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "nonexistent-cart-item-99" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: "cart-7",
      userId: "user-7",
      items: [],
    });
    expect(mockedDb.cartItem.delete).toHaveBeenCalledTimes(1);
    expect(mockedDb.cartItem.delete).toHaveBeenCalledWith({
      where: { id: "cart-item-99" },
    });
  });
});
