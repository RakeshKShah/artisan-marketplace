import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const db = new PrismaClient({ adapter });

const categories = [
  { name: "Pottery", slug: "pottery" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Textiles", slug: "textiles" },
  { name: "Woodwork", slug: "woodwork" },
  { name: "Candles & Soap", slug: "candles-soap" },
  { name: "Art & Prints", slug: "art-prints" },
];

const demoProducts = [
  {
    title: "Hand-thrown Ceramic Mug",
    description: "A cozy stoneware mug with a speckled glaze, perfect for morning coffee.",
    priceCents: 3200,
    stock: 5,
    categorySlug: "pottery",
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca1d?w=600",
  },
  {
    title: "Silver Leaf Earrings",
    description: "Delicate sterling silver earrings inspired by autumn leaves.",
    priceCents: 4500,
    stock: 0,
    categorySlug: "jewelry",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600",
  },
  {
    title: "Handwoven Linen Scarf",
    description: "Soft natural linen scarf in earthy tones, woven on a traditional loom.",
    priceCents: 6800,
    stock: 3,
    categorySlug: "textiles",
    imageUrl: "https://images.unsplash.com/photo-1520903920243-00d872a2bd1c?w=600",
  },
];

async function main() {
  for (const cat of categories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@artisan.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const hash = await bcrypt.hash(adminPassword, 10);

  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Marketplace Admin",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  const sellerHash = await bcrypt.hash("seller123", 10);
  const seller = await db.user.upsert({
    where: { email: "maya@artisan.local" },
    update: {},
    create: {
      email: "maya@artisan.local",
      name: "Maya Chen",
      passwordHash: sellerHash,
      role: "SELLER",
      sellerProfile: {
        create: {
          storeName: "Maya's Clay Studio",
          bio: "Portland-based potter crafting functional ceramics with natural glazes.",
          status: "APPROVED",
        },
      },
    },
    include: { sellerProfile: true },
  });

  if (seller.sellerProfile) {
    for (const p of demoProducts) {
      const category = await db.category.findUnique({ where: { slug: p.categorySlug } });
      if (!category) continue;

      const existing = await db.product.findFirst({
        where: { sellerId: seller.sellerProfile.id, title: p.title },
      });
      if (!existing) {
        await db.product.create({
          data: {
            sellerId: seller.sellerProfile.id,
            categoryId: category.id,
            title: p.title,
            description: p.description,
            priceCents: p.priceCents,
            stock: p.stock,
            imageUrl: p.imageUrl,
          },
        });
      }
    }
  }

  console.log("Seeded categories, admin, and demo seller with products");
  console.log("  Admin:", adminEmail, "/", adminPassword);
  console.log("  Demo seller: maya@artisan.local / seller123");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
