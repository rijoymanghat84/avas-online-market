"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, BarChart3, ExternalLink, Check, X } from "lucide-react";

interface TrendDetail {
  id: string;
  term: string;
  score: number;
  source: string;
  status: string;
  discoveredAt: string;
  interestOverTime?: { trend: string; values: number[] };
  relatedQueries?: { top: { query: string; value: number }[]; rising: any[] };
  peopleAlsoAsk?: { question: string }[];
}

export default function TrendDetailPage() {
  const { id } = useParams();
  const [trend, setTrend] = useState<TrendDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trends/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTrend(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    await fetch(`/api/trends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    setTrend((prev) => (prev ? { ...prev, status: "approved" } : prev));
  };

  const handleReject = async () => {
    await fetch(`/api/trends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    setTrend((prev) => (prev ? { ...prev, status: "rejected" } : prev));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-500" />
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500">Trend not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/trends" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{trend.term}</h1>
          </div>
          <div className="flex items-center gap-2">
            {trend.status === "pending" && (
              <>
                <button
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  onClick={handleReject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                >
                  <X size={14} /> Reject
                </button>
              </>
            )}
            {trend.status === "approved" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Check size={14} /> Approved
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Opportunity Score</p>
                  <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">{trend.score}</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <TrendingUp size={28} />
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${trend.score}%` }} />
              </div>
            </div>

            {/* Interest Over Time */}
            {trend.interestOverTime && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Interest Over Time
                </h3>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-zinc-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                    Trend: {trend.interestOverTime.trend}
                  </span>
                </div>
                {trend.interestOverTime.values.length > 0 && (
                  <div className="mt-4 flex items-end gap-1 h-24">
                    {trend.interestOverTime.values.map((v, i) => {
                      const max = Math.max(...trend.interestOverTime!.values);
                      const height = max > 0 ? (v / max) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-emerald-500/60 hover:bg-emerald-500 transition-colors"
                          style={{ height: `${height}%` }}
                          title={`Value: ${v}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Related Queries */}
            {trend.relatedQueries && trend.relatedQueries.top.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Related Queries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trend.relatedQueries.top.map((q, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {q.query}
                      <span className="text-xs text-zinc-400">({q.value})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Details
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Source</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">{trend.source.replace("_", " ")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Discovered</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {new Date(trend.discoveredAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Status</dt>
                  <dd className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">{trend.status}</dd>
                </div>
              </dl>
            </div>

            {/* PAA */}
            {trend.peopleAlsoAsk && trend.peopleAlsoAsk.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  People Also Ask
                </h3>
                <ul className="space-y-2">
                  {trend.peopleAlsoAsk.map((q, i) => (
                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                      {q.question}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {trend.status === "approved" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Next Steps
                </h3>
                <Link
                  href={`/products/create?keyword=${encodeURIComponent(trend.term)}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <ExternalLink size={14} />
                  Generate PDF Product
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
