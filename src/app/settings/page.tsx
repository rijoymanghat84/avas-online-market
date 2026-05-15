"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Globe, Key, TrendingUp, Save } from "lucide-react";

export default function SettingsPage() {
  const [proxyMode, setProxyMode] = useState("none");
  const [webshareUser, setWebshareUser] = useState("");
  const [websharePass, setWebsharePass] = useState("");
  const [redditId, setRedditId] = useState("");
  const [redditSecret, setRedditSecret] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // In production, this would POST to an API endpoint
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        {/* Proxy Settings */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={18} className="text-emerald-600" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Proxy Configuration</h2>
          </div>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Residential proxy is required for reliable Google Trends scraping from VPS.
            <a href="https://www.webshare.io/?referral_code=7w9k6g9k" target="_blank" rel="noopener" className="ml-1 text-emerald-600 hover:underline">
              Get WebShare proxy →
            </a>
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Proxy Mode</label>
              <select
                value={proxyMode}
                onChange={(e) => setProxyMode(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="none">None (Reddit + PAA only)</option>
                <option value="webshare_rotating">WebShare Rotating Residential ($1.40/GB)</option>
                <option value="webshare_static">WebShare Static Residential ($0.23/IP)</option>
              </select>
            </div>

            {proxyMode !== "none" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
                    <input
                      type="text"
                      value={webshareUser}
                      onChange={(e) => setWebshareUser(e.target.value)}
                      placeholder="your_webshare_username"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                    <input
                      type="password"
                      value={websharePass}
                      onChange={(e) => setWebsharePass(e.target.value)}
                      placeholder="your_webshare_password"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Reddit API */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <Globe size={18} className="text-orange-600" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Reddit API</h2>
          </div>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Required for Reddit trend scraping. Register at{" "}
            <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener" className="text-emerald-600 hover:underline">
              reddit.com/prefs/apps
            </a>
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Client ID</label>
              <input
                type="text"
                value={redditId}
                onChange={(e) => setRedditId(e.target.value)}
                placeholder="your_reddit_client_id"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Client Secret</label>
              <input
                type="password"
                value={redditSecret}
                onChange={(e) => setRedditSecret(e.target.value)}
                placeholder="your_reddit_client_secret"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </section>

        {/* Trend Engine */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Trend Engine</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Geo Target</label>
                <select className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Max Trends/Run</label>
                <input
                  type="number"
                  defaultValue={20}
                  min={5}
                  max={100}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">Settings saved!</span>
          )}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </main>
    </div>
  );
}
