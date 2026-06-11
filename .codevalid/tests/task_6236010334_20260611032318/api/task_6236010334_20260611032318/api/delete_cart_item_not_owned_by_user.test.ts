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

describe("delete_cart_item_not_owned_by_user", () => {
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

  it("does not delete another user's cart item because only the authenticated buyer cart is searched", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-7", email: "buyer@example.com", name: "Buyer", role: "BUYER" },
    } as any);

    const userCart = {
      id: "cart-7",
      userId: "user-7",
      items: [
        {
          id: "cart-item-21",
          productId: "product-owned-by-user-7",
          quantity: 1,
          product: { stock: 4, seller: {}, category: {} },
        },
      ],
    };

    mockedDb.cart.upsert.mockResolvedValueOnce(userCart).mockResolvedValueOnce(userCart);

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "cart-item-88" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(userCart);
    expect(mockedDb.cart.upsert).toHaveBeenCalledTimes(2);
    expect(mockedDb.cartItem.delete).not.toHaveBeenCalled();
  });

  it("returns 401 for an unauthenticated deletion attempt", async () => {
    mockedAuth.mockResolvedValue(null as any);

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "cart-item-88" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockedDb.cart.upsert).not.toHaveBeenCalled();
    expect(mockedDb.cartItem.delete).not.toHaveBeenCalled();
  });

  it("deletes an item when the requested product belongs to the authenticated buyer cart", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-7", email: "buyer@example.com", name: "Buyer", role: "BUYER" },
    } as any);

    mockedDb.cart.upsert
      .mockResolvedValueOnce({
        id: "cart-7",
        userId: "user-7",
        items: [
          {
            id: "cart-item-88",
            productId: "cart-item-88",
            quantity: 1,
            product: { stock: 4, seller: {}, category: {} },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "cart-7",
        userId: "user-7",
        items: [],
      });
    mockedDb.cartItem.delete.mockResolvedValue({ id: "cart-item-88" });

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "cart-item-88" }),
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
      where: { id: "cart-item-88" },
    });
  });
});
