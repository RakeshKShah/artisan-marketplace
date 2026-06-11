import { Suspense } from "react";
import { db } from "@/lib/db";
import { buyerVisibleProductWhere } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const { q, category } = await searchParams;

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  const products = await db.product.findMany({
    where: {
      ...buyerVisibleProductWhere,
      ...(category
        ? { category: { slug: category } }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      seller: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="font-serif text-4xl font-semibold text-amber-950 md:text-5xl">
          Handmade goods from local artisans
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
          Discover unique pottery, jewelry, textiles, and more — crafted with care in your community.
        </p>
      </section>

      <Suspense fallback={<div className="h-24" />}>
        <SearchBar categories={categories} />
      </Suspense>

      <section className="mt-10">
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
            No products found. Try a different search or category.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                priceCents={product.priceCents}
                imageUrl={product.imageUrl}
                stock={product.stock}
                storeName={product.seller.storeName}
                categoryName={product.category.name}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
