CREATE OR REPLACE FUNCTION public.update_social_cloud_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_profile_id UUID;
  actor_profile_id  UUID;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles
      SET social_cloud_points = social_cloud_points + 10
      WHERE id = NEW.author_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      SELECT author_id INTO target_profile_id FROM public.posts WHERE id = NEW.post_id;
      actor_profile_id := NEW.user_id;
      IF target_profile_id IS NOT NULL
         AND actor_profile_id <> target_profile_id
         AND NOT public.is_blocked(actor_profile_id, target_profile_id) THEN
        UPDATE public.profiles
        SET social_cloud_points = social_cloud_points + 1
        WHERE id = target_profile_id;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      SELECT author_id INTO target_profile_id FROM public.posts WHERE id = OLD.post_id;
      actor_profile_id := OLD.user_id;
      IF target_profile_id IS NOT NULL
         AND actor_profile_id <> target_profile_id
         AND NOT public.is_blocked(actor_profile_id, target_profile_id) THEN
        UPDATE public.profiles
        SET social_cloud_points = social_cloud_points - 1
        WHERE id = target_profile_id;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'follows' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.follower_id <> NEW.following_id
         AND NOT public.is_blocked(NEW.follower_id, NEW.following_id) THEN
        UPDATE public.profiles
        SET social_cloud_points = social_cloud_points + 5
        WHERE id = NEW.following_id;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.follower_id <> OLD.following_id
         AND NOT public.is_blocked(OLD.follower_id, OLD.following_id) THEN
        UPDATE public.profiles
        SET social_cloud_points = social_cloud_points - 5
        WHERE id = OLD.following_id;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'events' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles
      SET social_cloud_points = social_cloud_points + 20
      WHERE id = NEW.creator_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;