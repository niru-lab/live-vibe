ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT
  DEFAULT 'guest'
  CHECK (role IN ('guest', 'venue_owner'));