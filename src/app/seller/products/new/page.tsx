import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { NewProductForm } from "@/components/NewProductForm";

export default async function NewProductPage() {
  const session = await requireAuth(["SELLER"]);

  const seller = await db.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!seller || seller.status !== "APPROVED") {
    redirect("/seller");
  }

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-serif text-3xl text-stone-900">Add a product</h1>
      <NewProductForm categories={categories} />
    </div>
  );
}
