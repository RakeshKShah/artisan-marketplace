import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminSellerActions } from "@/components/AdminSellerActions";
import { AdminRemoveListing } from "@/components/AdminRemoveListing";
import { formatPrice } from "@/lib/products";
import { RunPayoutsButton } from "@/components/RunPayoutsButton";

export default async function AdminPage() {
  await requireAuth(["ADMIN"]);

  const [sellers, products, pendingCount, suspendedCount] = await Promise.all([
    db.sellerProfile.findMany({
      include: { user: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.product.findMany({
      include: { seller: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    db.sellerProfile.count({ where: { status: "PENDING" } }),
    db.sellerProfile.count({ where: { status: "SUSPENDED" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Admin panel</h1>
      <p className="mt-2 text-stone-600">
        Manage sellers, moderate listings, and run weekly payouts.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Pending approval</p>
          <p className="text-3xl font-semibold text-amber-900">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Suspended sellers</p>
          <p className="text-3xl font-semibold text-red-700">{suspendedCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total listings</p>
          <p className="text-3xl font-semibold">{products.length}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <RunPayoutsButton />
        <p className="text-sm text-stone-500">
          Processes weekly seller payouts (10% platform fee retained).
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-stone-900">Sellers</h2>
        <p className="mt-1 text-sm text-stone-500">
          Approve new sellers before they can list. Suspending a seller hides all their products from buyers instantly.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2 pr-4">Store</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Products</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.id} className="border-b border-stone-100">
                  <td className="py-3 pr-4 font-medium">{seller.storeName}</td>
                  <td className="py-3 pr-4">
                    {seller.user.name}
                    <br />
                    <span className="text-stone-400">{seller.user.email}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        seller.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : seller.status === "SUSPENDED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {seller.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{seller._count.products}</td>
                  <td className="py-3">
                    <AdminSellerActions sellerId={seller.id} status={seller.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-stone-900">All listings</h2>
        <p className="mt-1 text-sm text-stone-500">
          Includes listings from suspended sellers (hidden from buyers) and removed items.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Seller</th>
                <th className="py-2 pr-4">Seller status</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Listing</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`border-b border-stone-100 ${
                    product.seller.status === "SUSPENDED" ? "bg-red-50/50" : ""
                  }`}
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-amber-800 hover:underline"
                    >
                      {product.title}
                    </Link>
                    <br />
                    <span className="text-stone-400">{product.category.name}</span>
                  </td>
                  <td className="py-3 pr-4">{product.seller.storeName}</td>
                  <td className="py-3 pr-4">{product.seller.status}</td>
                  <td className="py-3 pr-4">{formatPrice(product.priceCents)}</td>
                  <td className="py-3 pr-4">{product.status}</td>
                  <td className="py-3">
                    <AdminRemoveListing productId={product.id} status={product.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
