import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/products";

type ProductCardProps = {
  id: string;
  title: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
  storeName: string;
  categoryName: string;
};

export function ProductCard({
  id,
  title,
  priceCents,
  imageUrl,
  stock,
  storeName,
  categoryName,
}: ProductCardProps) {
  const soldOut = stock <= 0;

  return (
    <Link
      href={`/products/${id}`}
      className={`group block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md ${
        soldOut ? "opacity-60 grayscale" : ""
      }`}
    >
      <div className="relative aspect-square bg-stone-100">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-stone-800">
              Sold out
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-amber-700">{categoryName}</p>
        <h3 className="mt-1 font-serif text-lg text-stone-900">{title}</h3>
        <p className="mt-1 text-sm text-stone-500">by {storeName}</p>
        <p className="mt-2 font-medium text-amber-900">{formatPrice(priceCents)}</p>
      </div>
    </Link>
  );
}
