import Link from "next/link";
import { TrendingUp, Search, FileText, Settings, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Zap size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Ava&apos;s Online Market</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Trend Discovery → PDF → Publish</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Stats Row */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Trends Discovered" value="0" icon={<Search size={18} />} color="blue" />
          <StatCard label="Approved" value="0" icon={<TrendingUp size={18} />} color="emerald" />
          <StatCard label="Products Created" value="0" icon={<FileText size={18} />} color="amber" />
          <StatCard label="Published" value="0" icon={<Zap size={18} />} color="violet" />
        </div>

        {/* Action Cards */}
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            href="/trends"
            title="Trend Discovery"
            description="Scrape Reddit, Google Trends, and People Also Ask for trending topics."
            icon={<Search size={24} />}
            color="blue"
          />
          <ActionCard
            href="/products"
            title="Products"
            description="View approved trends, generate PDFs, and publish to Etsy/Shopify."
            icon={<FileText size={24} />}
            color="emerald"
          />
          <ActionCard
            href="/settings"
            title="Settings"
            description="Configure proxy, API keys, sources, and publishing destinations."
            icon={<Settings size={24} />}
            color="zinc"
          />
        </div>

        {/* Pipeline Visual */}
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Pipeline
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <PipelineStep label="Discover" status="ready" />
            <Arrow />
            <PipelineStep label="Approve" status="ready" />
            <Arrow />
            <PipelineStep label="Generate PDF" status="ready" />
            <Arrow />
            <PipelineStep label="Publish" status="ready" />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function ActionCard({ href, title, description, icon, color }: {
  href: string; title: string; description: string; icon: React.ReactNode; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "group-hover:border-blue-300 group-hover:bg-blue-50 dark:group-hover:border-blue-800 dark:group-hover:bg-blue-900/20",
    emerald: "group-hover:border-emerald-300 group-hover:bg-emerald-50 dark:group-hover:border-emerald-800 dark:group-hover:bg-emerald-900/20",
    zinc: "group-hover:border-zinc-300 group-hover:bg-zinc-50 dark:group-hover:border-zinc-700 dark:group-hover:bg-zinc-800/50",
  };

  return (
    <Link
      href={href}
      className={`group block rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 ${colorMap[color]}`}
    >
      <div className="mb-4 text-zinc-700 dark:text-zinc-300">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </Link>
  );
}

function PipelineStep({ label, status }: { label: string; status: string }) {
  const statusMap: Record<string, string> = {
    ready: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    active: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    done: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  };

  return (
    <span className={`rounded-full border px-4 py-1.5 text-sm font-medium ${statusMap[status]}`}>
      {label}
    </span>
  );
}

function Arrow() {
  return (
    <span className="text-zinc-300 dark:text-zinc-600">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="inline">
        <path d="M7 4L12.5 9.5L7 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
