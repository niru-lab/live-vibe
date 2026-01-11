-- Create venues table for clubs, bars, cafes, etc.
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bar', 'club', 'cafe', 'restaurant', 'other')),
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Stuttgart',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  description TEXT,
  owner_profile_id UUID REFERENCES public.profiles(id),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Venues are viewable by everyone
CREATE POLICY "Venues are viewable by everyone"
ON public.venues FOR SELECT
USING (true);

-- Owners can update their own venues
CREATE POLICY "Owners can update their own venues"
ON public.venues FOR UPDATE
USING (owner_profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Add venue_id to posts table for venue tagging
ALTER TABLE public.posts ADD COLUMN venue_id UUID REFERENCES public.venues(id);

-- Create index for faster queries
CREATE INDEX idx_posts_venue_id ON public.posts(venue_id);
CREATE INDEX idx_venues_city ON public.venues(city);
CREATE INDEX idx_venues_category ON public.venues(category);

-- Add trigger for updated_at
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Stuttgart locations from the map
INSERT INTO public.venues (name, category, address, city, latitude, longitude) VALUES
-- Bars
('Schwarz Weiß Bar', 'bar', 'Wilhelmstraße 8A, 70182 Stuttgart', 'Stuttgart', 48.7738, 9.1850),
('anderthalb Bar', 'bar', 'Königstraße 47, 70173 Stuttgart', 'Stuttgart', 48.7784, 9.1793),
('reBOOTS Bar', 'bar', 'Bopserstraße 9, 70180 Stuttgart', 'Stuttgart', 48.7695, 9.1882),
('Weißes Roß Bar', 'bar', 'Hauptstätter Straße 41, 70173 Stuttgart', 'Stuttgart', 48.7686, 9.1755),
('Jigger & Spoon', 'bar', 'Gymnasiumstraße 33, 70174 Stuttgart', 'Stuttgart', 48.7812, 9.1752),
('WXYZ Bar', 'bar', 'Heilbronner Straße 70, 70191 Stuttgart', 'Stuttgart', 48.7945, 9.1795),
-- Clubs
('Boa Discothek Stuttgart', 'club', 'Tübinger Straße 12–16, 70178 Stuttgart', 'Stuttgart', 48.7689, 9.1758),
('Rumors Club', 'club', 'Hauptstätter Straße 40, 70173 Stuttgart', 'Stuttgart', 48.7688, 9.1752),
('Proton The Club', 'club', 'Königstraße 49, 70173 Stuttgart', 'Stuttgart', 48.7786, 9.1790),
('Universum', 'club', 'Charlottenplatz 1, 70173 Stuttgart', 'Stuttgart', 48.7756, 9.1829),
('MICA Club', 'club', 'Kronprinzplatz, 70173 Stuttgart', 'Stuttgart', 48.7762, 9.1805),
('WONDERS Club', 'club', 'Friedrichstraße 13, 70174 Stuttgart', 'Stuttgart', 48.7797, 9.1768),
-- Cafés
('Kaffeerösterei Café Moulu', 'cafe', 'Senefelderstraße 58, 70176 Stuttgart', 'Stuttgart', 48.7765, 9.1625),
('Cafe Hegel', 'cafe', 'Eberhardstraße 35, 70173 Stuttgart', 'Stuttgart', 48.7752, 9.1778),
('Café Zuhause', 'cafe', 'Landhausstraße 201, 70188 Stuttgart', 'Stuttgart', 48.7885, 9.2055),
('Weltcafé Stuttgart', 'cafe', 'Charlottenplatz 17, 70173 Stuttgart', 'Stuttgart', 48.7758, 9.1835),
('Caffè-Bar', 'cafe', 'Torstraße 27, 70173 Stuttgart', 'Stuttgart', 48.7748, 9.1812),
('Mela Kaffee & Cafe', 'cafe', 'Königstraße 7, 70173 Stuttgart', 'Stuttgart', 48.7795, 9.1768),
('Glora Kaffeehaus', 'cafe', 'Calwer Straße 31, 70173 Stuttgart', 'Stuttgart', 48.7778, 9.1745),
('GLORA Kaffeehaus Filiale', 'cafe', 'Sophienstraße 24b, 70178 Stuttgart', 'Stuttgart', 48.7715, 9.1702),
('Café Moody', 'cafe', 'Uhlandstraße 26, 70182 Stuttgart', 'Stuttgart', 48.7728, 9.1868);