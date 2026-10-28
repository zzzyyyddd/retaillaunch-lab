"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DemoData = {
  product: { id: string; name: string };
  metrics: {
    views: number;
    tryons: number;
    love: number;
    maybe: number;
    notInterested: number;
    intentTotal: number;
    loveShare: number | null;
  };
  sampleLimited: boolean;
};

export default function DemoAnalyticsPage() {
  const [data, setData] = useState<DemoData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/demo/analytics");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Analytics unavailable");
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error"
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const metrics = data?.metrics;

  const cards = [
    ["Product Views", metrics?.views ?? 0],
    ["AI Try-On Starts", metrics?.tryons ?? 0],
    ["Love Votes", metrics?.love ?? 0],
    ["Total Intent Votes", metrics?.intentTotal ?? 0],
  ] as const;

  const breakdown = [
    ["Love it", metrics?.love ?? 0, "bg-emerald-400"],
    ["Maybe", metrics?.maybe ?? 0, "bg-amber-400"],
    ["Not interested", metrics?.notInterested ?? 0, "bg-rose-400"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-sm text-emerald-400">
            ← RetailLaunch Lab
          </Link>
          <span className="rounded-full border border-emerald-700 px-3 py-1 text-xs text-emerald-300">
            Public Read-Only Demo
          </span>
        </div>

        <h1 className="mt-8 text-3xl font-bold">
          Demand Intelligence
        </h1>

        <p className="mt-2 text-slate-400">
          Live aggregated demand signals for the Emerald Evening Dress.
        </p>

        {loading && <p className="mt-8">Loading analytics...</p>}

        {error && (
          <p className="mt-8 rounded-xl border border-red-800 p-4 text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && metrics && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-3 text-3xl font-bold text-emerald-400">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                Purchase Intent Breakdown
              </h2>

              <div className="mt-6 space-y-5">
                {breakdown.map(([label, value, color]) => {
                  const percentage = metrics.intentTotal
                    ? (value / metrics.intentTotal) * 100
                    : 0;

                  return (
                    <div key={label}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                Demand Confidence
              </h2>

              <p className="mt-4 text-4xl font-bold text-emerald-400">
                {metrics.loveShare === null
                  ? "N/A"
                  : `${metrics.loveShare}%`}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Positive intent share among recorded votes.
                These signals are not confirmed purchases.
              </p>

              {metrics.intentTotal < 30 && (
                <p className="mt-4 text-sm text-amber-300">
                  Small sample: additional customer feedback is needed
                  before making inventory decisions.
                </p>
              )}

              {data.sampleLimited && (
                <p className="mt-4 text-sm text-amber-300">
                  Event retrieval limit reached. Metrics may be incomplete.
                </p>
              )}
            </section>

            <div className="mt-8">
              <Link
                href="/shop"
                className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950"
              >
                Try the Product Experience
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
