import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const pythonDir = path.join(process.cwd(), "python");
    const { stdout, stderr } = await execAsync(
      `cd ${pythonDir} && python3 trend-engine.py --discover --sources reddit paa`,
      { timeout: 60000, env: { ...process.env, PYTHONPATH: pythonDir } }
    );

    if (stderr) {
      console.warn("[trend-engine stderr]", stderr);
    }

    // Parse the JSON output from the Python script
    const lines = stdout.trim().split("\n");
    const jsonLine = lines.find((line) => line.startsWith("{"));

    if (!jsonLine) {
      return NextResponse.json(
        { error: "No JSON output from trend engine", raw: stdout },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonLine);

    // Transform to frontend format
    const trends = data.trends?.map((t: any, idx: number) => ({
      id: `${t.source}-${idx}-${Date.now()}`,
      term: t.term || t.question || "Unknown",
      score: t.score || 50,
      source: t.source,
      rank: t.rank || idx + 1,
      status: "pending",
      discoveredAt: t.discovered_at || new Date().toISOString(),
      traffic: t.traffic,
      upvotes: t.upvotes,
      comments: t.comments,
      question: t.question,
    }));

    return NextResponse.json({
      trends: trends || [],
      meta: data.meta || {},
    });
  } catch (error: any) {
    console.error("[discover] error:", error);
    return NextResponse.json(
      { error: error.message || "Discovery failed" },
      { status: 500 }
    );
  }
}
