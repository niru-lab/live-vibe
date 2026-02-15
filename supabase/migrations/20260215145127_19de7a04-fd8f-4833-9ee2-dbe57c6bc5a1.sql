
-- Fix: Move extensions out of public schema
CREATE EXTENSION IF NOT EXISTS citext SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Fix: Set search_path on calculate_level (the only function missing it)
CREATE OR REPLACE FUNCTION public.calculate_level(pts INTEGER) RETURNS INTEGER LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN pts >= 10000 THEN 9 WHEN pts >= 5000 THEN 8 WHEN pts >= 2500 THEN 7 WHEN pts >= 1200 THEN 6 WHEN pts >= 600 THEN 5 WHEN pts >= 300 THEN 4 WHEN pts >= 100 THEN 3 WHEN pts >= 30 THEN 2 ELSE 1 END;
$$;
