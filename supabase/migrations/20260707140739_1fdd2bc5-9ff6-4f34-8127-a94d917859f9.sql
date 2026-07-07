ALTER TABLE public.events ADD COLUMN IF NOT EXISTS music_genres text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS events_music_genres_gin_idx ON public.events USING gin (music_genres);