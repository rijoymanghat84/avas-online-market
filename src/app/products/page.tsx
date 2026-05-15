"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink, CheckCircle, Clock, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  status: "draft" | "published" | "generating";
  platform: string;
  createdAt: string;
  trendTerm: string;
}

export default function ProductsPage() {
  const [products] = useState<Product[]>([]);
  const [filter, setFilter] = useState("all");

  const filtered = products.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Products</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(["all", "draft", "generating", "published"] as const).map((f) => (
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
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{filtered.length} products</span>
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900">
            <Package size={48} className="mb-4 text-zinc-300 dark:text-zinc-600" />
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No products yet</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Approve trends from the discovery page to generate PDFs
            </p>
            <Link
              href="/trends"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <FileText size={16} />
              Go to Trend Discovery
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
