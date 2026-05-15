import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trend = store.getTrend(id);
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
  const updated = store.updateTrend(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Trend not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
