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

describe("delete_cart_item_success", () => {
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

  it("deletes an existing cart item for the authenticated buyer", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-7", email: "buyer@example.com", name: "Buyer", role: "BUYER" },
    } as any);

    mockedDb.cart.upsert
      .mockResolvedValueOnce({
        id: "cart-7",
        userId: "user-7",
        items: [
          {
            id: "cart-item-42",
            productId: "product-42",
            quantity: 1,
            product: { stock: 3, seller: {}, category: {} },
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "cart-7",
        userId: "user-7",
        items: [],
      });
    mockedDb.cartItem.delete.mockResolvedValue({ id: "cart-item-42" });

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "product-42" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: "cart-7",
      userId: "user-7",
      items: [],
    });
    expect(mockedDb.cart.upsert).toHaveBeenCalledTimes(2);
    expect(mockedDb.cartItem.delete).toHaveBeenCalledTimes(1);
    expect(mockedDb.cartItem.delete).toHaveBeenCalledWith({
      where: { id: "cart-item-42" },
    });
  });

  it("returns 401 when the buyer is not authenticated", async () => {
    mockedAuth.mockResolvedValue(null as any);

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "product-42" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(mockedDb.cart.upsert).not.toHaveBeenCalled();
    expect(mockedDb.cartItem.delete).not.toHaveBeenCalled();
  });

  it("returns the unchanged cart when the product is not in the buyer cart", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user-7", email: "buyer@example.com", name: "Buyer", role: "BUYER" },
    } as any);

    const unchangedCart = {
      id: "cart-7",
      userId: "user-7",
      items: [
        {
          id: "cart-item-10",
          productId: "different-product",
          quantity: 2,
          product: { stock: 5, seller: {}, category: {} },
        },
      ],
    };

    mockedDb.cart.upsert
      .mockResolvedValueOnce(unchangedCart)
      .mockResolvedValueOnce(unchangedCart);

    const request = new Request("http://localhost/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: "missing-product" }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(unchangedCart);
    expect(mockedDb.cart.upsert).toHaveBeenCalledTimes(2);
    expect(mockedDb.cartItem.delete).not.toHaveBeenCalled();
  });
});
