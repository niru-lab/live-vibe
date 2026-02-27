
-- Rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Sonstiges',
  activity TEXT,
  location_name TEXT,
  address TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cover_image_url TEXT,
  hoster_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Room members table
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('hoster', 'contributor', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Room recurring events table
CREATE TABLE public.room_recurring_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  recurrence TEXT NOT NULL DEFAULT 'weekly' CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER, -- 0=Sunday, 6=Saturday (for weekly)
  day_of_month INTEGER, -- 1-31 (for monthly)
  time_of_day TIME NOT NULL DEFAULT '18:00',
  location_name TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_recurring_events ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Public rooms viewable by everyone" ON public.rooms
FOR SELECT USING (visibility = 'public' OR hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR id IN (SELECT room_id FROM room_members WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Hosters can update their rooms" ON public.rooms
FOR UPDATE USING (hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Hosters can delete their rooms" ON public.rooms
FOR DELETE USING (hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Room members policies
CREATE POLICY "Members viewable by room members" ON public.room_members
FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR room_id IN (SELECT id FROM rooms WHERE visibility = 'public')
);

CREATE POLICY "Users can join rooms" ON public.room_members
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Hosters can manage members" ON public.room_members
FOR DELETE USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR room_id IN (SELECT id FROM rooms WHERE hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Hosters can update member roles" ON public.room_members
FOR UPDATE USING (
  room_id IN (SELECT id FROM rooms WHERE hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Recurring events policies
CREATE POLICY "Recurring events viewable by members" ON public.room_recurring_events
FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR room_id IN (SELECT id FROM rooms WHERE visibility = 'public')
);

CREATE POLICY "Hosters can manage recurring events" ON public.room_recurring_events
FOR INSERT WITH CHECK (
  room_id IN (SELECT id FROM rooms WHERE hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Hosters can update recurring events" ON public.room_recurring_events
FOR UPDATE USING (
  room_id IN (SELECT id FROM rooms WHERE hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Hosters can delete recurring events" ON public.room_recurring_events
FOR DELETE USING (
  room_id IN (SELECT id FROM rooms WHERE hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Auto-add hoster as member on room creation
CREATE OR REPLACE FUNCTION public.auto_add_room_hoster()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id, role) VALUES (NEW.id, NEW.hoster_id, 'hoster');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_add_room_hoster
AFTER INSERT ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.auto_add_room_hoster();

-- Updated_at trigger for rooms
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_recurring_events_updated_at
BEFORE UPDATE ON public.room_recurring_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
