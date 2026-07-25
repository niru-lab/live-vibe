DROP POLICY IF EXISTS "Hoster or members can post in room" ON public.room_posts;

CREATE POLICY "Hoster or members can post in room"
  ON public.room_posts
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND (
      room_id IN (SELECT id FROM public.rooms WHERE hoster_id = room_posts.author_id)
      OR (
        public.is_room_approved_member(author_id, room_id)
        AND (SELECT chat_policy FROM public.rooms WHERE id = room_posts.room_id) = 'members'
        AND NOT public.is_blocked(
          author_id,
          (SELECT hoster_id FROM public.rooms WHERE id = room_posts.room_id)
        )
      )
    )
  );