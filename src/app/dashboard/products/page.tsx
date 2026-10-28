"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  created_at: string;
};

export default function ProductsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        window.location.replace("/login");
        return;
      }

      const [campaignResult, productResult] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id,name")
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id,campaign_id,name,description,image_url,price,created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (campaignResult.error) {
        setMessage(campaignResult.error.message);
      } else {
        const items = campaignResult.data ?? [];
        setCampaigns(items);
        if (items.length) setCampaignId(items[0].id);
      }

      if (productResult.error) {
        setMessage(productResult.error.message);
      } else {
        setProducts(productResult.data ?? []);
      }

      setLoading(false);
    }

    void load();
  }, []);

  async function createProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const parsedPrice = Number(price);

    if (
      !campaignId ||
      !name.trim() ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      setMessage("Choose a campaign, name and valid price.");
      return;
    }

    if (imageUrl.trim()) {
      try {
        const url = new URL(imageUrl.trim());
        if (!["https:", "http:"].includes(url.protocol)) {
          setMessage("Image URL must use HTTP or HTTPS.");
          return;
        }
      } catch {
        setMessage("Enter a valid image URL.");
        return;
      }
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError || !auth.user) {
        setMessage("Session expired. Please sign in again.");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .insert({
          campaign_id: campaignId,
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          price: parsedPrice,
        })
        .select(
          "id,campaign_id,name,description,image_url,price,created_at"
        )
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setProducts((current) => [data, ...current]);
      setName("");
      setDescription("");
      setImageUrl("");
      setPrice("0");
      setMessage("Product created successfully.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-10">Loading product catalog...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-emerald-400"
        >
          ← Back to Campaign Studio
        </Link>

        <h1 className="mt-5 text-3xl font-bold">Product Catalog</h1>
        <p className="mt-2 text-slate-400">
          Add products to validate demand before production.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <form
            onSubmit={createProduct}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold">Add Product</h2>

            <label className="block text-sm">
              Campaign
              <select
                required
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              >
                {campaigns.length === 0 && (
                  <option value="">Create a campaign first</option>
                )}
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Product name
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Emerald Evening Dress"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              />
            </label>

            <label className="block text-sm">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Premium green evening dress."
                className="mt-2 min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              />
            </label>

            <label className="block text-sm">
              Price (USD)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              />
            </label>

            <label className="block text-sm">
              Product image URL
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/dress.jpg"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
              />
            </label>

            <button
              disabled={saving || campaigns.length === 0}
              className="w-full rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Product"}
            </button>

            {message && (
              <p role="status" className="text-sm text-amber-300">
                {message}
              </p>
            )}
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Products ({products.length})
            </h2>

            <div className="mt-5 space-y-4">
              {products.length === 0 ? (
                <p className="text-slate-400">No products yet.</p>
              ) : (
                products.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {product.description || "No description"}
                    </p>
                    <p className="mt-2 font-semibold text-emerald-400">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Campaign:{" "}
                      {campaigns.find(
                        (campaign) => campaign.id === product.campaign_id
                      )?.name ?? "Unknown"}
                    </p>
                    {product.image_url && (
                      <a
                        href={product.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm text-sky-400 underline"
                      >
                        View product image
                      </a>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
