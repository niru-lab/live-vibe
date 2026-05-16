-- Extend notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_accepted';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_declined';