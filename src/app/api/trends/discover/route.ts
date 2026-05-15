import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const pythonDir = path.join(process.cwd(), "python");

    // Use spawn to separate stdout and stderr
    const result = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        const proc = spawn(
          "python3",
          ["trend-engine.py", "--discover", "--sources", "reddit", "paa"],
          {
            cwd: pythonDir,
            env: { ...process.env, PYTHONPATH: pythonDir },
          }
        );

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        proc.on("close", (code) => {
          if (code !== 0 && !stdout) {
            reject(new Error(stderr || `Process exited with code ${code}`));
          } else {
            resolve({ stdout, stderr });
          }
        });

        proc.on("error", reject);
      }
    );

    if (result.stderr) {
      console.warn("[trend-engine stderr]", result.stderr);
    }

    // Parse JSON from stdout - find the largest JSON object
    const stdout = result.stdout.trim();
    let data: any = null;

    // Try parsing the whole stdout first
    try {
      data = JSON.parse(stdout);
    } catch {
      // Find JSON by looking for { ... } blocks
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch {
          // ignore
        }
      }
    }

    if (!data) {
      return NextResponse.json(
        { error: "No JSON output from trend engine", raw: stdout.slice(0, 500) },
        { status: 500 }
      );
    }

    // Transform to frontend format and save to store
    const trends = data.trends?.map((t: any, idx: number) => {
      const id = `${t.source}-${idx}-${Date.now()}`;
      const trend = {
        id,
        term: t.term || t.question || "Unknown",
        score: t.score || 50,
        source: t.source,
        rank: t.rank || idx + 1,
        status: "pending" as const,
        discoveredAt: t.discovered_at || new Date().toISOString(),
        traffic: t.traffic,
        upvotes: t.upvotes,
        comments: t.comments,
        question: t.question,
      };
      store.saveTrend(trend);
      return trend;
    });

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
