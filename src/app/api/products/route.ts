import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const products = store.getProducts({ status });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const product = {
    id,
    ...body,
    status: "draft" as const,
    createdAt: new Date().toISOString(),
  };
  store.saveProduct(product);
  return NextResponse.json(product, { status: 201 });
}
