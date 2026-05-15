import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trend = await prisma.trendSearch.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!trend) {
      return NextResponse.json(
        { success: false, error: "Trend not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, trend });
  } catch (error) {
    console.error("Failed to fetch trend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trend" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.trendSearch.update({
      where: { id },
      data: {
        status: body.status,
        aiAnalyzed: body.aiAnalyzed,
        aiScore: body.aiScore,
        aiNotes: body.aiNotes,
      },
    });

    return NextResponse.json({ success: true, trend: updated });
  } catch (error) {
    console.error("Failed to update trend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update trend" },
      { status: 500 }
    );
  }
}
