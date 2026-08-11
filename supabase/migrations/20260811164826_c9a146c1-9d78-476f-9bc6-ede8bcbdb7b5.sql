create or replace function public.purge_user_data(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _pid uuid;
  r record;
begin
  select id into _pid from public.profiles where user_id = _user_id;
  if _pid is null then
    return;
  end if;

  for r in
    select * from (values
      ('blocks','blocker_id'), ('blocks','blocked_id'),
      ('chat_requests','sender_id'), ('chat_requests','recipient_id'),
      ('comments','user_id'),
      ('direct_messages','sender_id'), ('direct_messages','recipient_id'),
      ('event_attendees','user_id'),
      ('event_messages','sender_id'), ('event_messages','recipient_id'),
      ('event_participants','user_id'),
      ('follows','follower_id'), ('follows','following_id'),
      ('likes','user_id'),
      ('message_reads','user_id'),
      ('notifications','recipient_id'),
      ('offer_activations','profile_id'),
      ('point_ledger','profile_id'),
      ('privacy_settings','profile_id'),
      ('push_preferences','profile_id'),
      ('push_sends','profile_id'),
      ('push_tokens','profile_id'),
      ('referral_shares','profile_id'),
      ('referrals','referrer_profile_id'), ('referrals','referred_profile_id'),
      ('reports','reporter_id'),
      ('room_members','user_id'),
      ('room_posts','author_id'),
      ('timeline_items','profile_id'),
      ('user_points','profile_id'),
      ('venue_offers','venue_id'),
      ('rooms','hoster_id'),
      ('events','creator_id'),
      ('posts','author_id')
    ) as t(tbl, col)
  loop
    if to_regclass('public.' || r.tbl) is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = r.tbl and column_name = r.col
       )
    then
      execute format('delete from public.%I where %I = $1', r.tbl, r.col) using _pid;
    end if;
  end loop;

  delete from public.profiles where id = _pid;
end;
$$;

revoke all on function public.purge_user_data(uuid) from public;
revoke all on function public.purge_user_data(uuid) from anon;
revoke all on function public.purge_user_data(uuid) from authenticated;
grant execute on function public.purge_user_data(uuid) to service_role;