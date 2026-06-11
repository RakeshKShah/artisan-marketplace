import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { buyerVisibleProductWhere, formatPrice } from "@/lib/products";
import { AddToCartButton } from "@/components/AddToCartButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  const product = await db.product.findFirst({
    where: { id, ...buyerVisibleProductWhere },
    include: {
      seller: true,
      category: true,
      reviews: {
        include: { buyer: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) notFound();

  const soldOut = product.stock <= 0;
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div
          className={`relative aspect-square overflow-hidden rounded-2xl bg-stone-100 ${
            soldOut ? "grayscale opacity-70" : ""
          }`}
        >
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            priority
          />
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-6 py-3 text-lg font-semibold uppercase">
                Sold out
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-amber-700">
            {product.category.name}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-stone-900">{product.title}</h1>
          <p className="mt-2 text-stone-600">
            by{" "}
            <span className="font-medium text-amber-900">{product.seller.storeName}</span>
          </p>
          {avgRating && (
            <p className="mt-2 text-sm text-amber-800">
              ★ {avgRating.toFixed(1)} ({product.reviews.length} reviews)
            </p>
          )}
          <p className="mt-6 text-3xl font-medium text-amber-900">
            {formatPrice(product.priceCents)}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            {soldOut ? "Currently unavailable" : `${product.stock} in stock`}
          </p>
          <p className="mt-6 leading-relaxed text-stone-700">{product.description}</p>
          <div className="mt-8">
            <AddToCartButton productId={product.id} disabled={soldOut} />
          </div>

          <div className="mt-10 rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-lg">About the maker</h2>
            <p className="mt-2 text-stone-600">{product.seller.bio || "No bio yet."}</p>
          </div>
        </div>
      </div>

      {product.reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-stone-900">Reviews</h2>
          <div className="mt-6 space-y-4">
            {product.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.buyer.name}</span>
                  <span className="text-amber-800">{"★".repeat(review.rating)}</span>
                </div>
                <p className="mt-2 text-stone-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
