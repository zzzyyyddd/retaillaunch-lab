import Image from "next/image";
import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Launch before production",
    description:
      "Publish a collection concept and validate demand before committing to inventory.",
  },
  {
    number: "02",
    title: "AI-powered virtual try-on",
    description:
      "Let shoppers visualize an outfit on themselves using real YouCam AI technology.",
  },
  {
    number: "03",
    title: "Measure purchase intent",
    description:
      "Capture shopper feedback and turn early interest into actionable demand signals.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070d12] text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          RetailLaunch<span className="text-emerald-400"> Lab.</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/demo/analytics"
            className="hidden text-emerald-300 transition hover:text-emerald-200 sm:inline"
          >
            Live Analytics
          </Link>
          <Link
            href="/shop"
            className="text-slate-300 transition hover:text-white"
          >
            Collection
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-5 py-2.5 transition hover:bg-white/10"
          >
            Retailer Login
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-10 lg:grid-cols-2 lg:pt-12">
        <div>
          <div className="mb-7 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-medium tracking-wide text-emerald-300">
            POWERED BY YOUCAM AI
          </div>

          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            See it.
            <br />
            Love it.
            <br />
            <span className="text-emerald-400">
              Before it exists.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
            The pre-production fashion launch platform that combines
            AI Virtual Try-On with real consumer demand intelligence.
            Test what shoppers love before manufacturing begins.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="rounded-full bg-emerald-400 px-7 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Try AI Virtual Try-On →
            </Link>

            <Link
              href="/demo/analytics"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-7 py-4 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
            >
              View Live Analytics →
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Real YouCam API integration · Live shopper feedback ·
            Pre-production demand validation
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-emerald-400/10 blur-3xl" />

          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#111c24] p-4 shadow-2xl">
            <div className="relative aspect-[5/6] overflow-hidden rounded-2xl bg-[#16252b]">
              <Image
                src="/products/emerald-dress-hd.png"
                alt="Emerald Evening Dress collection preview"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                  Featured concept
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Emerald Evening Dress
                </h2>
              </div>

              <Link
                href="/shop"
                className="rounded-full bg-white px-5 py-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-200"
              >
                Try it on →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0b141b] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            How it works
          </p>

          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            From collection idea to evidence-backed decisions.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"
              >
                <p className="text-sm font-semibold text-emerald-400">
                  {feature.number}
                </p>
                <h3 className="mt-7 text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Build what people actually want.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-slate-400">
          Explore the collection, experience AI-powered virtual try-on,
          and help shape the next product launch.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/shop"
            className="inline-flex rounded-full bg-emerald-400 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Explore the Collection →
          </Link>
          <Link
            href="/demo/analytics"
            className="inline-flex rounded-full border border-white/20 px-8 py-4 text-sm font-semibold transition hover:bg-white/10"
          >
            Explore Demand Intelligence →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-slate-500">
        RetailLaunch Lab · Built with YouCam AI, Next.js and Supabase
      </footer>
    </main>
  );
}
