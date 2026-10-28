"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  productId: string;
  productName: string;
  imageUrl: string | null;
};

type Stage = "idle" | "uploading" | "generating" | "done" | "error";

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data as T;
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const result = await apiJson<{ file_id: string }>(
    "/api/youcam/upload",
    { method: "POST", body: form }
  );

  return result.file_id;
}

export default function VirtualTryOn({
  productId,
  productName,
  imageUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [intent, setIntent] = useState("");
  const [savingIntent, setSavingIntent] = useState(false);
  const [intentMessage, setIntentMessage] = useState("");

  const cancelRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  async function submitIntent(eventType: string) {
    if (savingIntent || stage !== "done") return;

    setSavingIntent(true);
    setIntentMessage("");

    try {
      const response = await fetch("/api/demand/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          event_type: eventType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save feedback");
      }

      setIntent(eventType);
      setIntentMessage("Thanks! Your feedback has been recorded.");
    } catch (error) {
      setIntentMessage(
        error instanceof Error ? error.message : "Unable to save feedback"
      );
    } finally {
      setSavingIntent(false);
    }
  }

  async function generate() {
    if (runningRef.current || !photo || !imageUrl || !consent) return;

    runningRef.current = true;
    cancelRef.current = false;
    setResultUrl("");
    setIntent("");
    setIntentMessage("");
    setAttempts(0);

    try {
      setStage("uploading");
      setMessage("Uploading your photo...");

      try {
        const trackingResponse = await fetch("/api/demand/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            event_type: "tryon_started",
          }),
        });

        if (!trackingResponse.ok) {
          console.warn("Try-on tracking failed:", trackingResponse.status);
        }
      } catch (trackingError) {
        console.warn("Try-on tracking unavailable:", trackingError);
      }

      const srcId = await uploadImage(photo);

      if (cancelRef.current) return;

      setMessage("Uploading garment reference...");

      const garmentResponse = await fetch(imageUrl);
      if (!garmentResponse.ok) {
        throw new Error("Unable to load product image");
      }

      const blob = await garmentResponse.blob();

      const garmentFile = new File(
        [blob],
        "garment.png",
        { type: blob.type || "image/png" }
      );

      const refId = await uploadImage(garmentFile);

      if (cancelRef.current) return;

      setStage("generating");
      setMessage("AI is generating your virtual outfit...");

      const task = await apiJson<{ task_id: string }>(
        "/api/youcam/tryon",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            src_file_id: srcId,
            ref_file_id: refId,
          }),
        }
      );

      for (let attempt = 1; attempt <= 90; attempt++) {
        if (cancelRef.current) return;

        setAttempts(attempt);

        await new Promise<void>((resolve) =>
          setTimeout(resolve, 2000)
        );

        if (cancelRef.current) return;

        const status = await apiJson<{
          task_status: string;
          data: {
            results?: {
              url?: string;
              images?: Array<{ url?: string }>;
            };
          } | null;
        }>(
          `/api/youcam/status?task_id=${encodeURIComponent(task.task_id)}`
        );

        if (status.task_status === "error") {
          throw new Error("YouCam could not generate this try-on");
        }

        if (status.task_status === "success") {
          const output =
            status.data?.results?.url ||
            status.data?.results?.images?.[0]?.url;

          if (!output) {
            throw new Error(
              "Generation succeeded but no result image URL was returned"
            );
          }

          setResultUrl(output);
          setStage("done");
          setMessage("Your virtual outfit is ready!");
          return;
        }
      }

      throw new Error("Generation timed out. Please try again later.");
    } catch (error) {
      if (!cancelRef.current) {
        setStage("error");
        setMessage(
          error instanceof Error ? error.message : "Unexpected error"
        );
      }
    } finally {
      runningRef.current = false;
    }
  }

  const busy = stage === "uploading" || stage === "generating";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!imageUrl}
        className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        ✨ Try It On With AI
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Virtual Try-On"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  RetailLaunch Lab · AI Fitting Room
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Try On {productName}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Upload a clear, single-person photo to preview this outfit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  cancelRef.current = true;
                  setOpen(false);
                }}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 font-semibold">Your Photo</p>

                <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-600 bg-slate-800 p-4">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Your selected photo"
                      className="max-h-80 w-full object-contain"
                    />
                  ) : (
                    <span className="text-center text-slate-400">
                      Click to upload a full-body photo
                      <span className="mt-2 block text-xs">
                        PNG or JPEG · Under 10 MB
                      </span>
                    </span>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size >= 10 * 1024 * 1024) {
                        setMessage("Please select an image under 10 MB.");
                        setStage("error");
                        return;
                      }
                      setPhoto(file);
                      setStage("idle");
                      setResultUrl("");
                      setMessage("");
                    }}
                  />
                </label>
              </div>

              <div>
                <p className="mb-3 font-semibold">
                  {stage === "done" ? "AI Try-On Result" : "Selected Outfit"}
                </p>

                <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl bg-slate-800 p-3">
                  {resultUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resultUrl}
                      alt="AI-generated virtual try-on result"
                      className="max-h-80 w-full object-contain"
                    />
                  ) : imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={productName}
                      className="max-h-80 w-full object-contain"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <label className="mt-6 flex items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={consent}
                disabled={busy}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm I have permission to use this photo and agree
                to send it to YouCam for AI Virtual Try-On processing.
              </span>
            </label>

            <button
              type="button"
              onClick={generate}
              disabled={!photo || !imageUrl || !consent || busy}
              className="mt-5 w-full rounded-xl bg-emerald-500 px-5 py-4 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Processing Virtual Try-On..." : "Generate My Look"}
            </button>

            {message && (
              <p
                role="status"
                className={`mt-4 text-center text-sm ${
                  stage === "error" ? "text-red-400" : "text-emerald-300"
                }`}
              >
                {message}
                {stage === "generating" ? ` (check ${attempts})` : ""}
              </p>
            )}

            {resultUrl && (
              <a
                href={resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center text-sm text-emerald-400 underline"
              >
                Open generated image
              </a>
            )}

            {stage === "done" && (
              <section className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-5">
                <h3 className="text-lg font-bold">
                  Would you buy this outfit?
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Help the retailer decide what to produce next.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "love", label: "❤️ Love It" },
                    { value: "maybe", label: "🤔 Maybe" },
                    { value: "not_interested", label: "✕ Not Interested" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={savingIntent}
                      onClick={() => submitIntent(option.value)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                        intent === option.value
                          ? "border-emerald-400 bg-emerald-500 text-slate-950"
                          : "border-slate-600 bg-slate-900 text-white hover:border-emerald-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {intentMessage && (
                  <p role="status" className="mt-3 text-sm text-emerald-300">
                    {intentMessage}
                  </p>
                )}
              </section>
            )}

            <p className="mt-5 text-center text-xs text-slate-500">
              AI-generated preview only. Actual fit and appearance may vary.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
