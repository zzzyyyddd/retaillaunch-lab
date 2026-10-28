"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth(mode: "login" | "signup") {
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login`,
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "signup") {
      setMessage(
        "Registration submitted. Check your email for confirmation if required."
      );
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <p className="mb-2 text-sm font-semibold text-emerald-400">
          RetailLaunch Lab
        </p>
        <h1 className="mb-2 text-3xl font-bold">
          Retailer Portal
        </h1>
        <p className="mb-8 text-sm text-slate-400">
          Validate fashion demand before committing to inventory.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
          />

          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3"
          />

          <button
            onClick={() => handleAuth("login")}
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-emerald-500 p-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Sign In"}
          </button>

          <button
            onClick={() => handleAuth("signup")}
            disabled={loading || !email || password.length < 6}
            className="w-full rounded-lg border border-slate-700 p-3 font-semibold disabled:opacity-50"
          >
            Create Account
          </button>
        </div>

        {message && (
          <p role="status" className="mt-5 text-sm text-amber-300">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
