import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type QuotaKind = "upload" | "status";

export async function checkYoucamAuxQuota(
  request: NextRequest,
  kind: QuotaKind
): Promise<{
  allowed: boolean;
  session: string;
  error?: string;
  status?: number;
}> {
  const existing = request.cookies.get("youcam_session")?.value;

  const session =
    existing && /^[a-f0-9]{64}$/.test(existing)
      ? existing
      : randomBytes(32).toString("hex");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return {
      allowed: false,
      session,
      error: "Quota protection unavailable",
      status: 503,
    };
  }

  const visitorKey = createHash("sha256")
    .update(session)
    .digest("hex");

  try {
    const admin = createClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await admin.rpc(
      "reserve_youcam_aux_quota",
      {
        p_kind: kind,
        p_visitor_key: visitorKey,
      }
    );

    if (error) {
      console.error("YouCam auxiliary quota:", error.message);

      return {
        allowed: false,
        session,
        error: "Quota protection unavailable",
        status: 503,
      };
    }

    return {
      allowed: data === true,
      session,
      error: data === true
        ? undefined
        : "Daily request limit reached",
      status: data === true ? undefined : 429,
    };
  } catch (error) {
    console.error("YouCam quota check failed:", error);

    return {
      allowed: false,
      session,
      error: "Quota protection unavailable",
      status: 503,
    };
  }
}

export function withYoucamSession(
  response: NextResponse,
  session: string
): NextResponse {
  response.cookies.set("youcam_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
