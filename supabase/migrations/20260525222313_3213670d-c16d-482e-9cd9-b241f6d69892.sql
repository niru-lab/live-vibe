ALTER TABLE public.venues
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS venue_type TEXT,
  ADD COLUMN IF NOT EXISTS address_street TEXT,
  ADD COLUMN IF NOT EXISTS address_zip TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_slots TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS day_pattern TEXT,
  ADD COLUMN IF NOT EXISTS offerings TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_tier TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_ok BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_tier INT DEFAULT 1
    CHECK (verification_tier BETWEEN 1 AND 3);

DROP POLICY IF EXISTS "Owners can insert own venues" ON public.venues;
CREATE POLICY "Owners can insert own venues" ON public.venues
  FOR INSERT WITH CHECK (
    owner_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );