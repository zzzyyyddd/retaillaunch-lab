import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const BASE_URL =
  process.env.YOUCAM_API_BASE_URL ||
  "https://yce-api-01.makeupar.com";

export async function POST(request: NextRequest) {
  const apiKey = process.env.YOUCAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "YouCam API key missing" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const { src_file_id, ref_file_id } = body;

    if (
      typeof src_file_id !== "string" ||
      typeof ref_file_id !== "string" ||
      !src_file_id ||
      !ref_file_id ||
      src_file_id.length > 512 ||
      ref_file_id.length > 512
    ) {
      return NextResponse.json(
        { error: "Valid image file IDs required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecret) {
      return NextResponse.json(
        { error: "Quota protection unavailable" },
        { status: 503 }
      );
    }

    const existingSession = request.cookies.get("youcam_session")?.value;
    const validSession =
      existingSession && /^[a-f0-9]{64}$/.test(existingSession)
        ? existingSession
        : null;

    const session = validSession ?? randomBytes(32).toString("hex");

    const withSession = (response: NextResponse): NextResponse => {
      response.cookies.set("youcam_session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    };

    const visitorKey = createHash("sha256")
      .update(session)
      .digest("hex");

    const admin = createClient(supabaseUrl, supabaseSecret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: allowed, error: quotaError } = await admin.rpc(
      "reserve_youcam_quota",
      { p_visitor_key: visitorKey }
    );

    if (quotaError) {
      console.error("YouCam quota error:", quotaError.message);
      return NextResponse.json(
        { error: "Quota protection unavailable" },
        { status: 503 }
      );
    }

    if (allowed !== true) {
      return withSession(NextResponse.json(
        { error: "Daily AI Try-On limit reached" },
        { status: 429 }
      ));
    }

    const response = await fetch(
      `${BASE_URL}/s2s/v2.0/task/cloth-v4`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          src_file_id,
          ref_file_id,
          garment_category: "full_body",
          filter_multi_person: "off",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      }
    );

    const result = await response.json();

    if (!response.ok || result.status !== 200) {
      return withSession(NextResponse.json(
        { error: "YouCam task creation failed" },
        { status: 502 }
      ));
    }

    const taskId = result.data?.task_id;

    if (!taskId) {
      return withSession(NextResponse.json(
        { error: "Missing task ID" },
        { status: 502 }
      ));
    }

    return withSession(NextResponse.json({
      task_id: taskId,
    }));
  } catch (error) {
    console.error("YouCam task failed:", error);

    return NextResponse.json(
      { error: "Unable to create Virtual Try-On task" },
      { status: 500 }
    );
  }
}
