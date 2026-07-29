ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cities text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.profiles
SET cities = ARRAY[city]
WHERE city IS NOT NULL AND city <> '' AND cities = '{}'::text[];