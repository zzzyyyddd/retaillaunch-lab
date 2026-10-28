"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  target_units: number;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetUnits, setTargetUnits] = useState("100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function initialize() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        window.location.replace("/login");
        return;
      }

      setEmail(auth.user.email ?? "");

      const { data, error } = await supabase
        .from("campaigns")
        .select("id,name,description,target_units,status,created_at")
        .order("created_at", { ascending: false });

      if (error) setMessage(error.message);
      else setCampaigns(data ?? []);

      setLoading(false);
    }

    void initialize();
  }, []);

  async function createCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const units = Number(targetUnits);

    if (!name.trim() || !Number.isSafeInteger(units) || units <= 0) {
      setMessage("Enter a campaign name and a valid production target.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();

      if (authError || !auth.user) {
        setMessage("Session expired. Please sign in again.");
        return;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          owner_id: auth.user.id,
          name: name.trim(),
          description: description.trim() || null,
          target_units: units,
          status: "draft",
        })
        .select("id,name,description,target_units,status,created_at")
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setCampaigns((current) => [data, ...current]);
      setName("");
      setDescription("");
      setTargetUnits("100");
      setMessage("Campaign created successfully.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  if (loading) {
    return <main className="p-10">Loading retailer workspace...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-emerald-400">RetailLaunch Lab</p>
            <h1 className="mt-2 text-3xl font-bold">Campaign Studio</h1>
            <p className="mt-2 text-sm text-slate-400">
              Signed in as {email}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2"
          >
            Sign Out
          </button>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <form
            onSubmit={createCampaign}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold">Create Campaign</h2>

            <label className="block text-sm">
              Campaign name
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summer Collection Demand Test"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              />
            </label>

            <label className="block text-sm">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test customer interest before ordering inventory."
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              />
            </label>

            <label className="block text-sm">
              Target production units
              <input
                required
                type="number"
                min="1"
                step="1"
                value={targetUnits}
                onChange={(e) => setTargetUnits(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              />
            </label>

            <button
              disabled={saving}
              className="w-full rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Campaign"}
            </button>

            {message && (
              <p role="status" className="text-sm text-amber-300">
                {message}
              </p>
            )}
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Your Campaigns ({campaigns.length})
            </h2>

            <div className="mt-5 space-y-4">
              {campaigns.length === 0 ? (
                <p className="text-slate-400">
                  No campaigns yet. Create your first experiment.
                </p>
              ) : (
                campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase text-emerald-300">
                        {campaign.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {campaign.description || "No description"}
                    </p>
                    <p className="mt-3 text-sm">
                      Production target: {campaign.target_units} units
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
