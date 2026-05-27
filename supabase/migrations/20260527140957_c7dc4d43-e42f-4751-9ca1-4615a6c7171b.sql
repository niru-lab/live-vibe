ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '_') || '_' || SUBSTR(NEW.id::text, 1, 4)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'role'
  );
  RETURN NEW;
END;
$function$;