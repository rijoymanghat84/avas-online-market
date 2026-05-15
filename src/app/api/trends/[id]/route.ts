import { NextRequest, NextResponse } from "next/server";

const trendStore = new Map();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trend = trendStore.get(id);
  if (!trend) {
    return NextResponse.json({ error: "Trend not found" }, { status: 404 });
  }
  return NextResponse.json(trend);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const trend = trendStore.get(id);
  if (!trend) {
    return NextResponse.json({ error: "Trend not found" }, { status: 404 });
  }
  const updated = { ...trend, ...body };
  trendStore.set(id, updated);
  return NextResponse.json(updated);
}
