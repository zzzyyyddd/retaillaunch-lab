-- RetailLaunch Lab
-- Application PostgreSQL functions
-- Run AFTER schema.sql on a NEW Supabase project.
-- Do not run this script on the existing production database.

BEGIN;

CREATE OR REPLACE FUNCTION public.reserve_youcam_aux_quota(
  p_kind text,
  p_visitor_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_day date := (now() AT TIME ZONE 'UTC')::date;
  v_limit integer;
  v_count integer;
  v_key text;
BEGIN
  IF p_kind NOT IN ('upload', 'status')
     OR p_visitor_key IS NULL
     OR length(p_visitor_key) < 16
     OR length(p_visitor_key) > 128 THEN
    RETURN false;
  END IF;

  v_limit := CASE
    WHEN p_kind = 'upload' THEN 60
    ELSE 1500
  END;

  v_key := 'retaillaunch:aux:' || p_kind || ':' || p_visitor_key;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_key || v_day::text, 0)
  );

  SELECT request_count INTO v_count
  FROM public.youcam_rate_limits
  WHERE rate_key = v_key AND day_utc = v_day;

  IF COALESCE(v_count, 0) >= v_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.youcam_rate_limits
    (rate_key, day_utc, request_count)
  VALUES (v_key, v_day, 1)
  ON CONFLICT (rate_key, day_utc)
  DO UPDATE SET request_count =
    public.youcam_rate_limits.request_count + 1;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_youcam_quota(
  p_visitor_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_day date := (now() AT TIME ZONE 'UTC')::date;
  v_global_count integer;
  v_visitor_count integer;
  v_total_count integer;
  v_total_day date := DATE '2026-10-28';
BEGIN
  IF p_visitor_key IS NULL
     OR length(p_visitor_key) < 16
     OR length(p_visitor_key) > 128 THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(72641001);

  SELECT request_count INTO v_global_count
  FROM public.youcam_rate_limits
  WHERE rate_key = 'retaillaunch:global'
    AND day_utc = v_day;

  SELECT request_count INTO v_visitor_count
  FROM public.youcam_rate_limits
  WHERE rate_key = 'retaillaunch:visitor:' || p_visitor_key
    AND day_utc = v_day;

  SELECT request_count INTO v_total_count
  FROM public.youcam_rate_limits
  WHERE rate_key = 'retaillaunch:demo:total'
    AND day_utc = v_total_day;

  IF COALESCE(v_global_count, 0) >= 100
     OR COALESCE(v_visitor_count, 0) >= 15
     OR COALESCE(v_total_count, 0) >= 350 THEN
    RETURN false;
  END IF;

  INSERT INTO public.youcam_rate_limits
    (rate_key, day_utc, request_count)
  VALUES
    ('retaillaunch:global', v_day, 1),
    ('retaillaunch:visitor:' || p_visitor_key, v_day, 1),
    ('retaillaunch:demo:total', v_total_day, 1)
  ON CONFLICT (rate_key, day_utc)
  DO UPDATE SET request_count =
    public.youcam_rate_limits.request_count + 1;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_purchase_intent(
  p_product_id uuid,
  p_session_hash text,
  p_event_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_event_type NOT IN ('love', 'maybe', 'not_interested')
     OR p_product_id IS NULL
     OR p_session_hash IS NULL
     OR p_session_hash !~ '^[a-f0-9]{64}$'
  THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_product_id::text || ':' || p_session_hash,
      0
    )
  );

  DELETE FROM public.demand_events
  WHERE product_id = p_product_id
    AND session_token_hash = p_session_hash
    AND event_type IN ('love', 'maybe', 'not_interested');

  INSERT INTO public.demand_events (
    product_id,
    session_token_hash,
    event_type
  )
  VALUES (
    p_product_id,
    p_session_hash,
    p_event_type
  );

  RETURN true;
END;
$function$;

-- Restrict RPC execution to trusted server-side access.

REVOKE ALL ON FUNCTION
  public.reserve_youcam_aux_quota(text, text),
  public.reserve_youcam_quota(text),
  public.save_purchase_intent(uuid, text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.reserve_youcam_aux_quota(text, text),
  public.reserve_youcam_quota(text),
  public.save_purchase_intent(uuid, text, text)
TO service_role;

COMMIT;
