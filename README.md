# RetailLaunch Lab

**Validate fashion demand before committing to inventory.**

RetailLaunch Lab is an AI-powered pre-production demand validation platform for fashion retailers, built for the YouCam API Skin AI & eCommerce VTO Hackathon 2026.

Retailers can showcase proposed garments, let shoppers experience AI virtual try-on, collect purchase-intent signals, and analyze demand before making inventory decisions.

## Live Demo

- **Application:** https://retaillaunch-lab.vercel.app/
- **Source Code:** https://github.com/zzzyyyddd/retaillaunch-lab

## The Problem

Fashion retailers often make inventory decisions without knowing whether customers actually want a new collection.

Traditional surveys cannot show shoppers how a garment might look on them. RetailLaunch Lab combines AI virtual try-on with customer feedback to provide more informative pre-launch demand signals.

## How It Works

1. Retailers create campaigns and publish proposed fashion products.
2. Shoppers explore the collection.
3. Shoppers upload a photo and generate an AI virtual try-on.
4. Shoppers choose Love It, Maybe, or Not Interested.
5. Retailers analyze customer interest before making inventory decisions.

## Features

- Real AI virtual try-on powered by YouCam Clothes V4
- Pre-production fashion product showcase
- Purchase-intent voting with one active choice per visitor and product
- Retailer campaign and product management
- Product views, try-on activity, and demand analytics
- Small-sample warnings for responsible interpretation
- Server-side API validation and quota protection

## YouCam API Integration

RetailLaunch Lab integrates YouCam's server-to-server Clothes V4 workflow.

| Step | Endpoint | Purpose |
|---|---|---|
| Upload | `POST /s2s/v2.0/file` | Initialize image upload |
| Generate | `POST /s2s/v2.0/task/cloth-v4` | Start virtual try-on |
| Retrieve | `GET /s2s/v2.0/task/cloth-v4/{taskId}` | Retrieve task status and results |

The YouCam API key is stored server-side. A real virtual try-on result has been successfully generated using the Emerald Evening Dress sample.

## Technology

Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase Auth and PostgreSQL, YouCam Clothes V4 API, Recharts, and Vercel.

## Local Setup

### Requirements

- Node.js compatible with Next.js 16
- npm
- Supabase project with the required database schema, policies, and RPC functions
- YouCam API credentials

### Installation

```bash
git clone https://github.com/zzzyyyddd/retaillaunch-lab.git
cd retaillaunch-lab
npm ci
cp -n .env.example .env.local
```

Configure `.env.local` with your own credentials. Never commit real API keys.

```bash
npm run dev
```

Open http://localhost:3000.

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public key |
| `SUPABASE_SECRET_KEY` | Server-only Supabase credential |
| `YOUCAM_API_KEY` | Server-only YouCam API credential |
| `YOUCAM_API_BASE_URL` | YouCam API base URL |

Database setup: [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md).

## Technical Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database Setup](docs/DATABASE_SETUP.md)
- [Judge Testing Guide](docs/JUDGE_TESTING.md)
- [Database Schema](supabase/schema.sql)
- [PostgreSQL Functions](supabase/functions.sql)

## Data and Security

- Sensitive API keys remain server-side.
- Purchase-intent votes are updated atomically through PostgreSQL.
- API requests are validated and rate-limited.
- Purchase intent is not equivalent to a confirmed purchase.
- Small samples should not be interpreted as statistically representative demand.

## Hackathon

**YouCam API Skin AI & eCommerce VTO Hackathon 2026**

Built by **zzzyyyddd Labs**.

RetailLaunch Lab is a hackathon prototype demonstrating how AI virtual try-on can support better pre-production fashion decisions.

## Public Judge Demo

- [Live Application](https://retaillaunch-lab.vercel.app/)
- [Shop and AI Virtual Try-On](https://retaillaunch-lab.vercel.app/shop)
- [Public Read-Only Analytics](https://retaillaunch-lab.vercel.app/demo/analytics)

The public analytics demo displays aggregated demand signals
for the Emerald Evening Dress without requiring retailer login.

The retailer dashboard remains protected by authentication.
