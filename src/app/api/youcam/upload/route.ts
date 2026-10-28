import { NextRequest, NextResponse } from "next/server";
import {
  checkYoucamAuxQuota,
  withYoucamSession,
} from "@/lib/youcam/aux-quota";

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

  const quota = await checkYoucamAuxQuota(request, "upload");

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
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return json(
        { error: "Image file required" },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return json(
        { error: "Only JPEG and PNG supported" },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size >= 10 * 1024 * 1024) {
      return json(
        { error: "Image must be under 10 MB" },
        { status: 400 }
      );
    }

    const fileName =
      `retaillaunch-${crypto.randomUUID()}.` +
      (file.type === "image/png" ? "png" : "jpg");

    const initResponse = await fetch(
      `${BASE_URL}/s2s/v2.0/file`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: [{
            content_type: file.type,
            file_name: fileName,
            file_size: file.size,
          }],
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      }
    );

    const init = await initResponse.json();

    if (!initResponse.ok || init.status !== 200) {
      return json(
        { error: "YouCam upload initialization failed" },
        { status: 502 }
      );
    }

    const entry = init.data?.files?.[0];
    const upload = entry?.requests?.find(
      (item: { method: string }) => item.method === "PUT"
    );

    if (!entry?.file_id || !upload?.url) {
      return json(
        { error: "Invalid YouCam upload response" },
        { status: 502 }
      );
    }

    const uploadUrl = new URL(upload.url);

    if (
      uploadUrl.protocol !== "https:" ||
      !(
        uploadUrl.hostname === "amazonaws.com" ||
        uploadUrl.hostname.endsWith(".amazonaws.com")
      )
    ) {
      return json(
        { error: "Unexpected signed upload host" },
        { status: 502 }
      );
    }

    const bytes = await file.arrayBuffer();

    const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: bytes,
      signal: AbortSignal.timeout(60000),
    });

    if (!putResponse.ok) {
      return json(
        { error: "Image upload to YouCam failed" },
        { status: 502 }
      );
    }

    return json({
      file_id: entry.file_id,
    });
  } catch (error) {
    console.error("YouCam upload failed:", error);

    return json(
      { error: "Unable to upload image" },
      { status: 500 }
    );
  }
}
