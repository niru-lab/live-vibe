
ALTER TABLE public.profiles 
ADD COLUMN show_badge_in_bio boolean NOT NULL DEFAULT false,
ADD COLUMN show_sc_in_bio boolean NOT NULL DEFAULT false;
