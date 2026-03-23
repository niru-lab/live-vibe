
-- Add 'eventer' to profile_type enum
ALTER TYPE public.profile_type ADD VALUE IF NOT EXISTS 'eventer';

-- Add new onboarding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS spot_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS music_genres text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS favorite_drink text,
  ADD COLUMN IF NOT EXISTS party_vibe_score integer,
  ADD COLUMN IF NOT EXISTS perfect_evening text,
  ADD COLUMN IF NOT EXISTS persona_color text,
  ADD COLUMN IF NOT EXISTS persona_text text,
  ADD COLUMN IF NOT EXISTS venue_name text,
  ADD COLUMN IF NOT EXISTS venue_type text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS opens_at text,
  ADD COLUMN IF NOT EXISTS closes_at text,
  ADD COLUMN IF NOT EXISTS price_segment text,
  ADD COLUMN IF NOT EXISTS venue_description text;
