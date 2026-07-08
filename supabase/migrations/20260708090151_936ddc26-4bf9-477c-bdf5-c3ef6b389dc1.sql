CREATE INDEX IF NOT EXISTS posts_city_created_idx
  ON public.posts (city_id, created_at DESC);