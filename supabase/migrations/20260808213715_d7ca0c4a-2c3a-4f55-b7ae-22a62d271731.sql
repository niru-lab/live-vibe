REVOKE EXECUTE ON FUNCTION public.is_venue_owner(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.venue_offer_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.offer_activation_count(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_venue_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.venue_offer_stats(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.offer_activation_count(uuid) TO authenticated, service_role;