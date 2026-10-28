# Supabase Database Setup

RetailLaunch Lab uses Supabase Authentication and PostgreSQL.

## Provision a New Project

1. Create a new Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/functions.sql`.
5. Create a retailer account using Supabase Authentication.
6. Configure the environment variables listed in `.env.example`.
7. Start the application using `npm ci` and `npm run dev`.

**Important:** The SQL scripts are intended for a fresh project. Do not execute them against an existing production database.

## Tables

| Table | Purpose |
|---|---|
| `campaigns` | Retailer-owned product launch campaigns |
| `products` | Products associated with campaigns |
| `demand_events` | Product views, try-on activity, and purchase-intent signals |
| `tryon_sessions` | Virtual try-on session records |
| `youcam_rate_limits` | Atomic API quota counters |

## Database Functions

- `save_purchase_intent`: replaces a visitor's existing intent vote for a product.
- `reserve_youcam_quota`: reserves a virtual try-on request against configured limits.
- `reserve_youcam_aux_quota`: limits upload and status polling requests.

The functions are restricted to `service_role` execution.

## Security

Row Level Security is enabled on all five application tables.

Authenticated retailers can manage their own campaigns and associated products. Anonymous visitors can read products. Private operational tables are not directly accessible to anonymous visitors.

Sensitive server-side operations use a Supabase server credential. Never expose that credential in browser code.

## Reproducibility

The SQL scripts create the database structure and functions, but do not include production user accounts, customer events, or API credentials.

Create a retailer account and campaign through the application before adding products.

The application requires valid YouCam API credentials and available API quota for live virtual try-on.
