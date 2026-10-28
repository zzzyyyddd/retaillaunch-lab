import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const COOKIE_NAME = "retail_session";
const VALID_EVENTS = ["product_view", "tryon_started", "love", "maybe", "not_interested"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const productId = body?.product_id;
    const eventType = body?.event_type;

    if (
      typeof productId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(productId) ||
      !VALID_EVENTS.includes(eventType)
    ) {
      return NextResponse.json(
        { error: "Invalid product or event type" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;

    if (!url || !secret) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    let sessionToken = request.cookies.get(COOKIE_NAME)?.value;

    if (!sessionToken || !/^[a-f0-9]{64}$/.test(sessionToken)) {
      sessionToken = randomBytes(32).toString("hex");
    }

    const sessionHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const isIntent = ["love", "maybe", "not_interested"].includes(
      eventType
    );

    let saveError: string | null = null;

    if (isIntent) {
      const { data, error } = await supabase.rpc(
        "save_purchase_intent",
        {
          p_product_id: productId,
          p_session_hash: sessionHash,
          p_event_type: eventType,
        }
      );

      if (error || data !== true) {
        saveError = error?.message ?? "Vote rejected";
      }
    } else {
      const { error } = await supabase
        .from("demand_events")
        .upsert(
          {
            product_id: productId,
            session_token_hash: sessionHash,
            event_type: eventType,
          },
          {
            onConflict: "product_id,session_token_hash,event_type",
          }
        );

      if (error) {
        saveError = error.message;
      }
    }

    if (saveError) {
      console.error("Demand event error:", saveError);
      return NextResponse.json(
        { error: "Unable to save purchase intent" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      event_type: eventType,
    });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Purchase intent error:", error);
    return NextResponse.json(
      { error: "Unable to process request" },
      { status: 500 }
    );
  }
}
