import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const trends = store.getTrends({ status });
  return NextResponse.json({ trends });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `trend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const trend = {
    id,
    ...body,
    status: "pending" as const,
    discoveredAt: new Date().toISOString(),
  };
  store.saveTrend(trend);
  return NextResponse.json(trend, { status: 201 });
}
