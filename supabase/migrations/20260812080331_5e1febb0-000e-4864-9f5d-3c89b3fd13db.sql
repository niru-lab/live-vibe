REVOKE EXECUTE ON FUNCTION public.assign_user_cards(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.send_card_batch(uuid, uuid[], text, uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.answer_card(uuid, uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.report_card_batch(uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.award_social_cloud_once(text, text, uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.assign_user_cards(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_card_batch(uuid, uuid[], text, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.answer_card(uuid, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_card_batch(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_social_cloud_once(text, text, uuid) TO authenticated, service_role;