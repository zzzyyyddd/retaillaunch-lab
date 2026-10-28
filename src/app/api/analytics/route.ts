import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: auth, error: authError } =
    await admin.auth.getUser(token);

  if (authError || !auth.user) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );
  }

  const { data: campaigns, error: campaignError } = await admin
    .from("campaigns")
    .select("id,name,target_units")
    .eq("owner_id", auth.user.id);

  if (campaignError) {
    return NextResponse.json(
      { error: "Unable to load campaigns" },
      { status: 500 }
    );
  }

  const campaignIds = (campaigns ?? []).map((c) => c.id);

  if (campaignIds.length === 0) {
    return NextResponse.json({ campaigns: [], products: [] });
  }

  const { data: products, error: productError } = await admin
    .from("products")
    .select("id,name,campaign_id")
    .in("campaign_id", campaignIds);

  if (productError) {
    return NextResponse.json(
      { error: "Unable to load products" },
      { status: 500 }
    );
  }

  const productIds = (products ?? []).map((p) => p.id);

  if (productIds.length === 0) {
    return NextResponse.json({
      campaigns,
      products: [],
    });
  }

  const { data: events, error: eventError } = await admin
    .from("demand_events")
    .select("product_id,event_type,session_token_hash")
    .in("product_id", productIds)
    .limit(10000);

  if (eventError) {
    return NextResponse.json(
      { error: "Unable to load demand events" },
      { status: 500 }
    );
  }

  const metrics = (products ?? []).map((product) => {
    const productEvents = (events ?? []).filter(
      (e) => e.product_id === product.id
    );

    const count = (type: string) =>
      productEvents.filter((e) => e.event_type === type).length;

    const views = count("product_view");
    const tryons = count("tryon_started");
    const love = count("love");
    const maybe = count("maybe");
    const notInterested = count("not_interested");

    const intentTotal = love + maybe + notInterested;

    return {
      ...product,
      views,
      tryons,
      love,
      maybe,
      notInterested,
      intentTotal,
      loveShare: intentTotal > 0
        ? Math.round((love / intentTotal) * 100)
        : null,
    };
  });

  return NextResponse.json({
    campaigns,
    products: metrics,
    sampleLimited: (events ?? []).length === 10000,
  });
}
