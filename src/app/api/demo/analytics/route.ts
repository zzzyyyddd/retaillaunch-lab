import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const DEMO_PRODUCT_ID = "e34f16f9-8e83-4e7d-b4c1-216385d3a723";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return NextResponse.json(
      { error: "Demo analytics unavailable" },
      { status: 503 }
    );
  }

  const admin = createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: product, error: productError } = await admin
    .from("products")
    .select("id,name,campaign_id")
    .eq("id", DEMO_PRODUCT_ID)
    .single();

  if (productError || !product) {
    return NextResponse.json(
      { error: "Demo product unavailable" },
      { status: 404 }
    );
  }

  const { data: events, error: eventsError } = await admin
    .from("demand_events")
    .select("event_type")
    .eq("product_id", DEMO_PRODUCT_ID)
    .limit(10000);

  if (eventsError) {
    return NextResponse.json(
      { error: "Demo metrics unavailable" },
      { status: 503 }
    );
  }

  const count = (type: string) =>
    (events ?? []).filter((event) => event.event_type === type).length;

  const love = count("love");
  const maybe = count("maybe");
  const notInterested = count("not_interested");
  const intentTotal = love + maybe + notInterested;

  return NextResponse.json(
    {
      product: {
        id: product.id,
        name: product.name,
      },
      metrics: {
        views: count("product_view"),
        tryons: count("tryon_started"),
        love,
        maybe,
        notInterested,
        intentTotal,
        loveShare:
          intentTotal > 0
            ? Math.round((love / intentTotal) * 100)
            : null,
      },
      sampleLimited: (events ?? []).length === 10000,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
