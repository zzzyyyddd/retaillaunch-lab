-- RetailLaunch Lab
-- PostgreSQL / Supabase schema
-- Run on a NEW Supabase project, not the production database.

BEGIN;

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed')),
  target_units integer NOT NULL DEFAULT 100
    CHECK (target_units > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL
    REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  price numeric NOT NULL DEFAULT 0
    CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.demand_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL
    REFERENCES public.products(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN (
      'product_view',
      'tryon_started',
      'tryon_completed',
      'favorite',
      'waitlist',
      'preorder_interest',
      'love',
      'maybe',
      'not_interested'
    )),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tryon_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL
    REFERENCES public.products(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  youcam_task_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.youcam_rate_limits (
  rate_key text NOT NULL,
  day_utc date NOT NULL,
  request_count integer NOT NULL DEFAULT 0
    CHECK (request_count >= 0),
  PRIMARY KEY (rate_key, day_utc)
);

CREATE INDEX idx_products_campaign
ON public.products(campaign_id);

CREATE INDEX idx_events_product_type
ON public.demand_events(product_id, event_type);

CREATE INDEX idx_tryon_product
ON public.tryon_sessions(product_id);

CREATE UNIQUE INDEX demand_events_product_session_type_unique
ON public.demand_events(
  product_id,
  session_token_hash,
  event_type
);

CREATE UNIQUE INDEX demand_events_one_intent_per_visitor
ON public.demand_events(product_id, session_token_hash)
WHERE event_type IN ('love', 'maybe', 'not_interested');

-- Row Level Security

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youcam_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage campaigns"
ON public.campaigns
FOR ALL TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Owners manage products"
ON public.products
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = products.campaign_id
      AND c.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = products.campaign_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Public can view products"
ON public.products
FOR SELECT TO anon
USING (true);

-- Explicit grants needed for Supabase API access.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.products TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.campaigns, public.products
TO authenticated;

GRANT ALL ON
  public.campaigns,
  public.products,
  public.demand_events,
  public.tryon_sessions,
  public.youcam_rate_limits
TO service_role;

-- No direct public access to private operational tables.

REVOKE ALL ON
  public.demand_events,
  public.tryon_sessions,
  public.youcam_rate_limits
FROM anon, authenticated;

COMMIT;
