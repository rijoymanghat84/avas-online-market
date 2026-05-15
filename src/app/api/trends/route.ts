import { NextRequest, NextResponse } from "next/server";

const trendStore = new Map();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let trends = Array.from(trendStore.values());
  if (status) {
    trends = trends.filter((t: any) => t.status === status);
  }

  return NextResponse.json({ trends });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `trend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const trend = { id, ...body, status: "pending", discoveredAt: new Date().toISOString() };
  trendStore.set(id, trend);
  return NextResponse.json(trend, { status: 201 });
}
