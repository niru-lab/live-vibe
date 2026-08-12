CREATE OR REPLACE FUNCTION public.respond_card_batch(_batch_id uuid, _accept boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid;
  _status text;
  _new text;
BEGIN
  _me := public.current_profile_id();
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT status INTO _status FROM public.card_send_batches
   WHERE id = _batch_id AND recipient_id = _me;
  IF _status IS NULL THEN RAISE EXCEPTION 'Karte nicht gefunden.'; END IF;
  IF _status IN ('blocked','reported','expired') THEN
    RAISE EXCEPTION 'Diese Karten sind nicht mehr verfügbar.';
  END IF;
  IF _status IN ('answered','skipped','accepted') THEN
    RETURN _status;
  END IF;

  _new := CASE WHEN _accept THEN 'accepted' ELSE 'skipped' END;

  UPDATE public.card_send_batches
     SET status = _new,
         responded_at = CASE WHEN _accept THEN responded_at ELSE now() END
   WHERE id = _batch_id;

  INSERT INTO public.card_interactions (batch_id, profile_id, action)
  VALUES (_batch_id, _me, CASE WHEN _accept THEN 'accepted' ELSE 'skipped' END);

  RETURN _new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_card_batch(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.respond_card_batch(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.answer_card(_batch_id uuid, _card_id uuid, _answer_text text, _visibility text DEFAULT 'private'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid;
  _answer uuid;
  _status text;
BEGIN
  _me := public.current_profile_id();
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT status INTO _status FROM public.card_send_batches
   WHERE id = _batch_id AND recipient_id = _me;
  IF _status IS NULL THEN RAISE EXCEPTION 'Karte nicht gefunden.'; END IF;
  IF _status IN ('blocked','reported','expired','skipped') THEN
    RAISE EXCEPTION 'Diese Karten können nicht mehr beantwortet werden.';
  END IF;
  IF _status = 'pending' THEN
    RAISE EXCEPTION 'Bitte nimm die Karten zuerst an.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.card_send_items WHERE batch_id = _batch_id AND card_id = _card_id) THEN
    RAISE EXCEPTION 'Karte gehört nicht zu dieser Sendung.';
  END IF;

  INSERT INTO public.card_answers (batch_id, card_id, responder_id, answer_text, visibility)
  VALUES (_batch_id, _card_id, _me, btrim(_answer_text), coalesce(_visibility, 'private'))
  ON CONFLICT (batch_id, card_id) DO UPDATE
    SET answer_text = excluded.answer_text,
        visibility = excluded.visibility,
        updated_at = now()
  RETURNING id INTO _answer;

  UPDATE public.card_send_batches
     SET status = 'answered', responded_at = now()
   WHERE id = _batch_id;

  INSERT INTO public.card_interactions (batch_id, profile_id, action)
  VALUES (_batch_id, _me, 'answered');

  PERFORM public.award_social_cloud_once('cards_first_answered', 'card_batch', _batch_id);

  RETURN _answer;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.answer_card(uuid, uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.answer_card(uuid, uuid, text, text) TO authenticated;