import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trends = await prisma.trendSearch.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        products: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, trends });
  } catch (error) {
    console.error("Failed to fetch trends:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
