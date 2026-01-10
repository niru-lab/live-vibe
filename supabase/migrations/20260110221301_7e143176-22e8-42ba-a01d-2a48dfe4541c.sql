-- Add expires_at column for 24h posts
ALTER TABLE public.posts 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient expired posts lookup
CREATE INDEX idx_posts_expires_at ON public.posts (expires_at) WHERE expires_at IS NOT NULL;

-- Create function to delete expired posts (will be called by cron)
CREATE OR REPLACE FUNCTION public.delete_expired_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.posts 
  WHERE expires_at IS NOT NULL 
  AND expires_at < now();
END;
$$;