import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import path from "path";

const execAsync = promisify(exec);

const TRENDS_DIR = path.join(process.cwd(), "src", "lib", "trends");

interface TrendResult {
  keyword: string;
  source: string;
  score: number;
  category: string | null;
  metadata: Record<string, unknown>;
}

async function runPythonScraper(script: string): Promise<TrendResult[]> {
  try {
    const { stdout } = await execAsync(`python3 ${path.join(TRENDS_DIR, script)} 2>/dev/null`, {
      timeout: 120000,
    });
    return JSON.parse(stdout || "[]");
  } catch (e) {
    console.error(`Scraper ${script} failed:`, e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    // Run all scrapers in parallel
    const [googleResults, redditResults, paaResults] = await Promise.all([
      runPythonScraper("google-trends.py"),
      runPythonScraper("reddit-scraper.py"),
      runPythonScraper("people-also-ask.py"),
    ]);

    // Merge and rank
    const allResults = [
      ...googleResults.map((r) => ({ ...r, weightedScore: r.score * 1.2 })),
      ...redditResults.map((r) => ({ ...r, weightedScore: r.score * 1.0 })),
      ...paaResults.map((r) => ({ ...r, weightedScore: r.score * 0.9 })),
    ];

    allResults.sort((a, b) => b.weightedScore - a.weightedScore);

    // Store in database (upsert by keyword)
    const saved = [];
    for (const result of allResults.slice(0, 50)) {
      const existing = await prisma.trendSearch.findFirst({
        where: { keyword: result.keyword },
      });

      if (existing) {
        // Update score if higher
        if (result.score > (existing.score || 0)) {
          const updated = await prisma.trendSearch.update({
            where: { id: existing.id },
            data: {
              score: result.score,
              source: result.source,
              category: result.category || existing.category,
            },
          });
          saved.push(updated);
        } else {
          saved.push(existing);
        }
      } else {
        // Create new — default user is admin
        const admin = await prisma.user.findFirst({
          where: { email: "admin@ava.com" },
        });

        const created = await prisma.trendSearch.create({
          data: {
            keyword: result.keyword,
            source: result.source,
            score: result.score,
            category: result.category,
            status: "discovered",
            userId: admin?.id || "",
          },
        });
        saved.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      discovered: saved.length,
      sources: {
        google: googleResults.length,
        reddit: redditResults.length,
        paa: paaResults.length,
      },
      results: saved.slice(0, 20),
    });
  } catch (error) {
    console.error("Discovery failed:", error);
    return NextResponse.json(
      { success: false, error: "Discovery failed" },
      { status: 500 }
    );
  }
}
