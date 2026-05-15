"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, RefreshCw, Filter, TrendingUp, MessageSquare, HelpCircle, ExternalLink } from "lucide-react";

interface Trend {
  id: string;
  term: string;
  score: number;
  source: string;
  rank: number;
  status: "pending" | "approved" | "rejected";
  discoveredAt: string;
  traffic?: string;
  upvotes?: number;
  comments?: number;
  question?: string;
}

export default function TrendsPage() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setError("");
    try {
      const res = await fetch("/api/trends/discover", { method: "POST" });
      const data = await res.json();
      if (data.trends) {
        setTrends(data.trends);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      setError("Discovery failed. Check server logs.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/trends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, status: "approved" as const } : t)));
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/trends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    setTrends((prev) => prev.map((t) => (t.id === id ? { ...t, status: "rejected" as const } : t)));
  };

  const filteredTrends = trends.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const sourceIcon = (source: string) => {
    switch (source) {
      case "google_trends":
        return <TrendingUp size={14} className="text-amber-500" />;
      case "reddit":
        return <MessageSquare size={14} className="text-orange-500" />;
      case "people_also_ask":
        return <HelpCircle size={14} className="text-blue-500" />;
      default:
        return <Search size={14} />;
    }
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case "google_trends":
        return "Google Trends";
      case "reddit":
        return "Reddit";
      case "people_also_ask":
        return "People Also Ask";
      default:
        return source;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Trend Discovery</h1>
          </div>
          <button
            onClick={handleDiscover}
            disabled={isDiscovering}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isDiscovering ? "animate-spin" : ""} />
            {isDiscovering ? "Discovering..." : "Discover Trends"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {filteredTrends.length} trends
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {trends.length === 0 && !isDiscovering && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900">
            <Search size={48} className="mb-4 text-zinc-300 dark:text-zinc-600" />
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No trends discovered yet</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Click "Discover Trends" to start scraping</p>
          </div>
        )}

        {/* Trends Table */}
        {filteredTrends.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Rank</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Trend</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Source</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Score</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                    <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredTrends.map((trend) => (
                    <tr key={trend.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">#{trend.rank}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {trend.term || trend.question}
                        </div>
                        {trend.traffic && (
                          <div className="text-xs text-zinc-500">{trend.traffic} searches</div>
                        )}
                        {trend.upvotes !== undefined && (
                          <div className="text-xs text-zinc-500">{trend.upvotes} upvotes · {trend.comments} comments</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {sourceIcon(trend.source)}
                          <span className="text-zinc-600 dark:text-zinc-400">{sourceLabel(trend.source)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${trend.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {trend.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={trend.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {trend.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(trend.id)}
                                className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(trend.id)}
                                className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <Link
                            href={`/trends/${trend.id}`}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] || map.pending}`}>
      {status}
    </span>
  );
}
