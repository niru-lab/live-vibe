-- Profile types enum
CREATE TYPE public.profile_type AS ENUM ('user', 'club', 'organizer');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  profile_type profile_type NOT NULL DEFAULT 'user',
  city TEXT,
  social_cloud_points INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Event categories enum
CREATE TYPE public.event_category AS ENUM ('club', 'house_party', 'bar', 'festival', 'concert', 'other');

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  expected_attendees INTEGER,
  entry_price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT true,
  dresscode TEXT,
  dos_and_donts TEXT,
  category event_category NOT NULL DEFAULT 'other',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    creator_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE USING (
    creator_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE USING (
    creator_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Posts table (Moment-X)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_moment_x BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE USING (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE USING (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Follows table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows policies
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    follower_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE USING (
    follower_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON public.likes FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can unlike posts"
  ON public.likes FOR DELETE USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Event attendees table
CREATE TABLE public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'interested',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Event attendees policies
CREATE POLICY "Event attendees are viewable by everyone"
  ON public.event_attendees FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join events"
  ON public.event_attendees FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can leave events"
  ON public.event_attendees FOR DELETE USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '_') || '_' || SUBSTR(NEW.id::text, 1, 4)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Function to update social cloud points
CREATE OR REPLACE FUNCTION public.update_social_cloud_points()
RETURNS TRIGGER AS $$
DECLARE
  target_profile_id UUID;
  points_change INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles SET social_cloud_points = social_cloud_points + 10 WHERE id = NEW.author_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'likes' THEN
    SELECT author_id INTO target_profile_id FROM public.posts WHERE id = NEW.post_id;
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles SET social_cloud_points = social_cloud_points + 1 WHERE id = target_profile_id;
    ELSIF TG_OP = 'DELETE' THEN
      SELECT author_id INTO target_profile_id FROM public.posts WHERE id = OLD.post_id;
      UPDATE public.profiles SET social_cloud_points = social_cloud_points - 1 WHERE id = target_profile_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'follows' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles SET social_cloud_points = social_cloud_points + 5 WHERE id = NEW.following_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.profiles SET social_cloud_points = social_cloud_points - 5 WHERE id = OLD.following_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'events' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.profiles SET social_cloud_points = social_cloud_points + 20 WHERE id = NEW.creator_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for social cloud points
CREATE TRIGGER on_post_for_points
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_social_cloud_points();

CREATE TRIGGER on_like_for_points
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_social_cloud_points();

CREATE TRIGGER on_follow_for_points
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_social_cloud_points();

CREATE TRIGGER on_event_for_points
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_social_cloud_points();

-- Enable realtime for posts and events
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;