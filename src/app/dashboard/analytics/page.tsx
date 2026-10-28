"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ProductMetric = {
  id: string;
  name: string;
  campaign_id: string;
  views: number;
  tryons: number;
  love: number;
  maybe: number;
  notInterested: number;
  intentTotal: number;
  loveShare: number | null;
};

type Analytics = {
  products: ProductMetric[];
  sampleLimited?: boolean;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          window.location.replace("/login");
          return;
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        const token = sessionError
          ? null
          : sessionData.session?.access_token;

        if (!token) {
          window.location.replace("/login");
          return;
        }

        const response = await fetch("/api/analytics", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

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

  const products = data?.products ?? [];

  const total = (field: keyof ProductMetric) =>
    products.reduce((sum, p) => {
      const value = p[field];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);

  const love = total("love");
  const maybe = total("maybe");
  const notInterested = total("notInterested");
  const votes = love + maybe + notInterested;

  const cards = [
    ["Product Views", total("views")],
    ["AI Try-On Starts", total("tryons")],
    ["Love Votes", love],
    ["Total Intent Votes", votes],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm text-emerald-400">
          ← Campaign Studio
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Demand Intelligence
        </h1>

        <p className="mt-2 text-slate-400">
          Measure consumer interest before committing to production.
        </p>

        {loading && <p className="mt-8">Loading analytics...</p>}

        {error && (
          <p className="mt-8 rounded-xl border border-red-800 p-4 text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && (
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

              <div className="mt-5 space-y-4">
                {[
                  ["Love it", love, "bg-emerald-400"],
                  ["Maybe", maybe, "bg-amber-400"],
                  ["Not interested", notInterested, "bg-rose-400"],
                ].map(([label, value, color]) => {
                  const count = Number(value);
                  const width = votes ? (count / votes) * 100 : 0;

                  return (
                    <div key={String(label)}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{count}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full ${color}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                Product Demand Signals
              </h2>

              <div className="mt-5 space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-slate-700 p-5"
                  >
                    <h3 className="font-semibold">{product.name}</h3>

                    <p className="mt-3 text-sm text-slate-300">
                      Views: {product.views} · Try-Ons: {product.tryons}
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      Love: {product.love} · Maybe: {product.maybe}
                      {" · "}Not interested: {product.notInterested}
                    </p>

                    <p className="mt-3 text-sm text-emerald-400">
                      Positive vote share:{" "}
                      {product.loveShare === null
                        ? "Not enough data"
                        : `${product.loveShare}%`}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {product.intentTotal < 30
                        ? "Insufficient evidence — collect at least 30 intent responses before reviewing demand."
                        : "Initial interest threshold reached. Validate demand quality, audience representativeness, and purchase commitments before production."}
                    </p>
                  </div>
                ))}

                {products.length === 0 && (
                  <p className="text-slate-400">
                    No products found for your campaigns.
                  </p>
                )}
              </div>
            </section>

            {data?.sampleLimited && (
              <p className="mt-5 text-sm text-amber-300">
                Analytics currently includes at most 10,000 events.
                Counts may be incomplete.
              </p>
            )}

            <p className="mt-6 text-xs text-slate-500">
              Intent votes are not purchases. Production decisions
              require additional commercial validation.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
