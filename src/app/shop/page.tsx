"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VirtualTryOn from "@/components/VirtualTryOn";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,image_url,price")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setError(error.message);
      } else {
        const loadedProducts = (data ?? []) as Product[];
        setProducts(loadedProducts);

        for (const product of loadedProducts) {
          fetch("/api/demand/intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: product.id,
              event_type: "product_view",
            }),
          }).catch(console.error);
        }
      }

      setLoading(false);
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-emerald-400">
              RetailLaunch Lab
            </p>
            <h1 className="text-4xl font-bold">Discover the Collection</h1>
            <p className="mt-3 text-slate-400">
              Explore upcoming fashion collections before production.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm"
          >
            Retailer Login
          </Link>
        </header>

        {loading && <p className="text-slate-400">Loading collection...</p>}

        {error && (
          <div className="rounded-xl border border-red-800 p-5 text-red-300">
            Unable to load products: {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl border border-slate-800 p-8">
            <p className="font-semibold">No public products available yet.</p>
            <p className="mt-2 text-sm text-slate-400">
              The retailer catalog may require a public read policy.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
            >
              <div className="flex aspect-square items-center justify-center bg-slate-800">
                {product.image_url ? (
                  // Supports local assets and future hosted image URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-500">Image coming soon</span>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold">{product.name}</h2>
                <p className="mt-2 min-h-12 text-sm text-slate-400">
                  {product.description}
                </p>
                <p className="mt-4 text-2xl font-bold text-emerald-400">
                  ${Number(product.price).toFixed(2)}
                </p>
                <VirtualTryOn
                  productId={product.id}
                  productName={product.name}
                  imageUrl={product.image_url}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
