
-- ============================================================
-- FEYRN BACKEND: COMPREHENSIVE SCHEMA EXTENSION (v2)
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ENUMS
CREATE TYPE public.visibility_level AS ENUM ('public', 'followers', 'private');
CREATE TYPE public.dm_policy AS ENUM ('everyone', 'followers', 'nobody');
CREATE TYPE public.post_type AS ENUM ('normal', 'moment_x');
CREATE TYPE public.invite_status AS ENUM ('invited', 'interested', 'accepted', 'declined');
CREATE TYPE public.outbox_status AS ENUM ('pending', 'processing', 'done', 'failed');
CREATE TYPE public.notification_type AS ENUM (
  'like', 'comment', 'follow', 'event_invite', 'event_message',
  'mention', 'level_up', 'moment_x_trending'
);

-- 3. PRIVACY SETTINGS
CREATE TABLE public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_visibility visibility_level NOT NULL DEFAULT 'public',
  dm_policy dm_policy NOT NULL DEFAULT 'everyone',
  location_enabled BOOLEAN NOT NULL DEFAULT true,
  discover_visible BOOLEAN NOT NULL DEFAULT true,
  online_status_visible BOOLEAN NOT NULL DEFAULT false,
  hide_event_attendance BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_profile_privacy() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN INSERT INTO public.privacy_settings (profile_id) VALUES (NEW.id) ON CONFLICT (profile_id) DO NOTHING; RETURN NEW; END; $$;
CREATE TRIGGER on_profile_created_privacy AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_privacy();

-- 4. BLOCKS
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocks" ON public.blocks FOR SELECT USING (blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can block" ON public.blocks FOR INSERT WITH CHECK (blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can unblock" ON public.blocks FOR DELETE USING (blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.is_blocked(checker_id UUID, target_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id = checker_id AND blocked_id = target_id) OR (blocker_id = target_id AND blocked_id = checker_id));
$$;

-- 5. CITIES
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, country_code TEXT NOT NULL DEFAULT 'DE',
  latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Berlin', is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities viewable by everyone" ON public.cities FOR SELECT USING (true);
INSERT INTO public.cities (name, country_code, latitude, longitude) VALUES ('Stuttgart', 'DE', 48.7758, 9.1829);

-- 6. EXTEND POSTS
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_type post_type NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);

-- 7. POST MEDIA
CREATE TABLE public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL, media_type TEXT NOT NULL DEFAULT 'image',
  width INTEGER, height INTEGER, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post media viewable by everyone" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "Authors can insert post media" ON public.post_media FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM posts p JOIN profiles pr ON pr.id = p.author_id WHERE p.id = post_id AND pr.user_id = auth.uid()));
CREATE POLICY "Authors can delete post media" ON public.post_media FOR DELETE USING (EXISTS (SELECT 1 FROM posts p JOIN profiles pr ON pr.id = p.author_id WHERE p.id = post_id AND pr.user_id = auth.uid()));

-- 8. EXTEND EVENTS
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS visibility visibility_level NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 9. EVENT INVITES
CREATE TABLE public.event_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES public.profiles(id),
  status invite_status NOT NULL DEFAULT 'invited',
  responded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, invited_user_id)
);
ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invites" ON public.event_invites FOR SELECT USING (invited_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR invited_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR event_id IN (SELECT id FROM events WHERE creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Event creators can invite" ON public.event_invites FOR INSERT WITH CHECK (invited_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Invited users can update status" ON public.event_invites FOR UPDATE USING (invited_user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 10. MESSAGE READS
CREATE TABLE public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.event_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reads" ON public.message_reads FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can mark as read" ON public.message_reads FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 11. USER POINTS + POINT LEDGER
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User points viewable by everyone" ON public.user_points FOR SELECT USING (true);

CREATE TABLE public.point_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL, reason TEXT NOT NULL, ref_type TEXT, ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ledger" ON public.point_ledger FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_profile_points() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN INSERT INTO public.user_points (profile_id) VALUES (NEW.id) ON CONFLICT (profile_id) DO NOTHING; RETURN NEW; END; $$;
CREATE TRIGGER on_profile_created_points AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_points();

-- 12. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type notification_type NOT NULL, ref_type TEXT, ref_id UUID,
  title TEXT NOT NULL, body TEXT, is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 13. OUTBOX EVENTS
CREATE TABLE public.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}',
  status outbox_status NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5, error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), processed_at TIMESTAMPTZ
);
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to outbox" ON public.outbox_events FOR SELECT USING (false);

-- 14. TIMELINE ITEMS
CREATE TABLE public.timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  score DOUBLE PRECISION NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own timeline" ON public.timeline_items FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 15. HOTSPOT CELLS
CREATE TABLE public.hotspot_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  cell_id TEXT NOT NULL, window_start TIMESTAMPTZ NOT NULL, window_end TIMESTAMPTZ NOT NULL,
  post_count INTEGER NOT NULL DEFAULT 0, engagement_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  center_lat DOUBLE PRECISION, center_lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, cell_id, window_start)
);
ALTER TABLE public.hotspot_cells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hotspots viewable by everyone" ON public.hotspot_cells FOR SELECT USING (true);

-- 16. OUTBOX TRIGGERS
CREATE OR REPLACE FUNCTION public.emit_outbox_event() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE evt_type TEXT; evt_payload JSONB;
BEGIN
  IF TG_TABLE_NAME = 'posts' AND TG_OP = 'INSERT' THEN
    evt_type := 'post_created'; evt_payload := jsonb_build_object('post_id', NEW.id, 'author_id', NEW.author_id, 'post_type', NEW.post_type, 'city_id', NEW.city_id, 'latitude', NEW.latitude, 'longitude', NEW.longitude);
  ELSIF TG_TABLE_NAME = 'likes' AND TG_OP = 'INSERT' THEN
    evt_type := 'like_added'; evt_payload := jsonb_build_object('post_id', NEW.post_id, 'user_id', NEW.user_id);
  ELSIF TG_TABLE_NAME = 'comments' AND TG_OP = 'INSERT' THEN
    evt_type := 'comment_added'; evt_payload := jsonb_build_object('post_id', NEW.post_id, 'user_id', NEW.user_id, 'comment_id', NEW.id);
  ELSIF TG_TABLE_NAME = 'follows' AND TG_OP = 'INSERT' THEN
    evt_type := 'follow_added'; evt_payload := jsonb_build_object('follower_id', NEW.follower_id, 'following_id', NEW.following_id);
  ELSIF TG_TABLE_NAME = 'event_invites' AND TG_OP = 'UPDATE' THEN
    evt_type := 'rsvp_changed'; evt_payload := jsonb_build_object('event_id', NEW.event_id, 'user_id', NEW.invited_user_id, 'status', NEW.status);
  ELSE RETURN COALESCE(NEW, OLD);
  END IF;
  INSERT INTO public.outbox_events (event_type, payload) VALUES (evt_type, evt_payload);
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER outbox_on_post_insert AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.emit_outbox_event();
CREATE TRIGGER outbox_on_like_insert AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.emit_outbox_event();
CREATE TRIGGER outbox_on_comment_insert AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.emit_outbox_event();
CREATE TRIGGER outbox_on_follow_insert AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.emit_outbox_event();
CREATE TRIGGER outbox_on_rsvp_update AFTER UPDATE ON public.event_invites FOR EACH ROW EXECUTE FUNCTION public.emit_outbox_event();

-- 17. INDEXES
CREATE INDEX IF NOT EXISTS idx_timeline_user_score ON public.timeline_items (user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_user_created ON public.timeline_items (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_city_created ON public.posts (city_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type_expires ON public.posts (post_type, expires_at) WHERE post_type = 'moment_x';
CREATE INDEX IF NOT EXISTS idx_posts_venue ON public.posts (venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_geo ON public.posts (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks (blocked_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON public.likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_city_starts ON public.events (city, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_creator ON public.events (creator_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_user ON public.event_invites (invited_user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (recipient_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON public.outbox_events (status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_hotspot_city_window ON public.hotspot_cells (city_id, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_hotspot_cell ON public.hotspot_cells (cell_id);
CREATE INDEX IF NOT EXISTS idx_venues_geo ON public.venues (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues (city);

-- 18. REALTIME (skip event_messages - already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_items;

-- 19. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.can_view_profile(viewer_id UUID, target_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN viewer_id = target_id THEN true WHEN public.is_blocked(viewer_id, target_id) THEN false
    WHEN (SELECT profile_visibility FROM privacy_settings WHERE profile_id = target_id) = 'public' THEN true
    WHEN (SELECT profile_visibility FROM privacy_settings WHERE profile_id = target_id) = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = viewer_id AND following_id = target_id) THEN true
    ELSE false END;
$$;

CREATE OR REPLACE FUNCTION public.can_send_dm(sender_id UUID, recipient_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.is_blocked(sender_id, recipient_id) THEN false
    WHEN (SELECT dm_policy FROM privacy_settings WHERE profile_id = recipient_id) = 'everyone' THEN true
    WHEN (SELECT dm_policy FROM privacy_settings WHERE profile_id = recipient_id) = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = recipient_id AND following_id = sender_id) THEN true
    ELSE false END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_level(pts INTEGER) RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN pts >= 10000 THEN 9 WHEN pts >= 5000 THEN 8 WHEN pts >= 2500 THEN 7 WHEN pts >= 1200 THEN 6 WHEN pts >= 600 THEN 5 WHEN pts >= 300 THEN 4 WHEN pts >= 100 THEN 3 WHEN pts >= 30 THEN 2 ELSE 1 END;
$$;

CREATE OR REPLACE FUNCTION public.add_points(p_profile_id UUID, p_delta INTEGER, p_reason TEXT, p_ref_type TEXT DEFAULT NULL, p_ref_id UUID DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO point_ledger (profile_id, delta, reason, ref_type, ref_id) VALUES (p_profile_id, p_delta, p_reason, p_ref_type, p_ref_id);
  INSERT INTO user_points (profile_id, points, level) VALUES (p_profile_id, GREATEST(0, p_delta), calculate_level(GREATEST(0, p_delta)))
  ON CONFLICT (profile_id) DO UPDATE SET points = GREATEST(0, user_points.points + p_delta), level = calculate_level(GREATEST(0, user_points.points + p_delta)), updated_at = now();
END; $$;
