import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ava.com" },
    update: {},
    create: {
      email: "admin@ava.com",
      name: "Ava Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Seed sample trend searches
  const trends = [
    { keyword: "Meal Prep for Shift Workers", source: "google_trends", score: 89, category: "Health", status: "approved" },
    { keyword: "ADHD-Friendly Home Organization", source: "reddit", score: 76, category: "Productivity", status: "discovered" },
    { keyword: "Budget Keto for College Students", source: "paa", score: 72, category: "Health", status: "discovered" },
    { keyword: "Digital Detox Workbook", source: "google_trends", score: 68, category: "Wellness", status: "published" },
    { keyword: "Minimalist Wardrobe Guide", source: "reddit", score: 65, category: "Lifestyle", status: "discovered" },
  ];

  for (const t of trends) {
    await prisma.trendSearch.create({
      data: {
        ...t,
        userId: admin.id,
      },
    });
  }

  // Seed a sample product
  const product = await prisma.product.create({
    data: {
      title: "Digital Detox Workbook",
      description: "A 30-day guided workbook to reclaim your attention and build healthier screen habits.",
      priceEtsy: 14.99,
      priceShopify: 19.99,
      status: "published",
      tags: "digital detox,mindfulness,productivity,self-care",
      etsyTags: "digital detox,mindfulness journal,productivity planner,self care,mental health",
      shopifyTags: "digital detox,mindfulness,productivity,self-care,workbook",
      seoTitle: "Digital Detox Workbook | 30-Day Mindfulness Guide",
      seoDescription: "Reclaim your attention with this guided 30-day digital detox workbook. Perfect for anyone feeling overwhelmed by screen time.",
      userId: admin.id,
    },
  });

  // Seed a sample sale
  await prisma.sale.create({
    data: {
      platform: "etsy",
      amount: 14.99,
      quantity: 1,
      productId: product.id,
    },
  });

  console.log("✅ Seed complete. Admin: admin@ava.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
