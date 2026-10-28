import { NextRequest, NextResponse } from "next/server";
import {
  checkYoucamAuxQuota,
  withYoucamSession,
} from "@/lib/youcam/aux-quota";


const BASE_URL =
  process.env.YOUCAM_API_BASE_URL ||
  "https://yce-api-01.makeupar.com";

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUCAM_API_KEY;
  const taskId = request.nextUrl.searchParams.get("task_id");

  if (!apiKey) {
    return NextResponse.json(
      { error: "YouCam API key is not configured" },
      { status: 500 }
    );
  }

  if (!taskId || !/^[a-zA-Z0-9_-]{1,128}$/.test(taskId)) {
    return NextResponse.json(
      { error: "Invalid task_id" },
      { status: 400 }
    );
  }

  const quota = await checkYoucamAuxQuota(request, "status");

  if (!quota.allowed) {
    return withYoucamSession(
      NextResponse.json(
        { error: quota.error },
        { status: quota.status ?? 503 }
      ),
      quota.session
    );
  }


  const json = (
    body: unknown,
    init?: ResponseInit
  ) => withYoucamSession(
    NextResponse.json(body, init),
    quota.session
  );

  try {
    const response = await fetch(
      `${BASE_URL}/s2s/v2.0/task/cloth-v4/${taskId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      }
    );

    const result = await response.json();

    if (!response.ok || (typeof result.status === "number" && result.status >= 400)) {
      return json(
        { error: "Unable to retrieve task" },
        { status: response.ok ? 502 : response.status }
      );
    }

    return json({
      task_status: result?.data?.task_status ?? "unknown",
      data: result?.data ?? null,
    });
  } catch (error) {
    console.error("YouCam status error:", error);
    return json(
      { error: "Unable to check Virtual Try-On status" },
      { status: 500 }
    );
  }
}
