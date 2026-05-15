import { NextRequest, NextResponse } from "next/server";

const productStore = new Map();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let products = Array.from(productStore.values());
  if (status) {
    products = products.filter((p: any) => p.status === status);
  }

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const product = {
    id,
    ...body,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
  productStore.set(id, product);
  return NextResponse.json(product, { status: 201 });
}
