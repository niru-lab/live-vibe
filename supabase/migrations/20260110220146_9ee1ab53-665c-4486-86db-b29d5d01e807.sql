-- Add music columns to posts table
ALTER TABLE public.posts 
ADD COLUMN music_url TEXT,
ADD COLUMN music_title TEXT,
ADD COLUMN music_artist TEXT;