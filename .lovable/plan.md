## Where "Anstehend" actually lives
There is **no Anstehend tab in the user profile** — it sits on `/events` (`src/pages/Events.tsx`). I will rebuild that tab. If you actually meant "move/add it to the Profile page", say so and I will relocate it; otherwise I rebuild it in place.

> Note: the project already has a parallel accept-flow via `event_attendees` + `host_accepted` (used by `AttendeeManager` and the host pending badge). Per your spec I add a **separate** `event_participants` table and leave the old one untouched so map, badges, and host messaging keep working.

## Database migration
New table `public.event_participants`:
- `id uuid pk default gen_random_uuid()`
- `event_id uuid not null` (no FK to keep schema convention)
- `user_id uuid not null` → references `profiles.id` (matches every other table in this project; auth.users is never referenced from public)
- `status text not null check (status in ('interested','requested','accepted','declined'))`
- `created_at timestamptz not null default now()`
- `unique (event_id, user_id)`

RLS:
- `SELECT`: row's `user_id` belongs to caller **OR** caller owns `events.creator_id` for that `event_id`. Implemented via `SECURITY DEFINER` helper `is_event_owner(_event_id uuid, _profile_id uuid)` to avoid recursion.
- `INSERT`: authenticated; `user_id` must be the caller's profile; `status` must be `interested` or `requested`; caller must NOT be the event creator (enforced in policy via the helper).
- `UPDATE`:
  - Caller updating own row → may move between `interested`/`requested` or delete (cancel).
  - Event owner → may set `status` to `accepted` or `declined`.
- `DELETE`: own row only.

Notifications:
- Extend the existing `notification_type` enum with `event_accepted` (and `event_declined` for symmetry).
- Add trigger `notify_on_participation_change` on `event_participants` `AFTER UPDATE`: when status flips to `accepted` → notify `user_id`; when to `declined` → notify `user_id`. Reuses the existing `create_notification(...)` helper.
- INSERT trigger when `status='requested'` → notify creator with type `event_join_request` (already exists in enum).

## New hook `src/hooks/useEventParticipation.ts`
Exports:
- `useMyParticipation(eventId)` → current user's row (status or null).
- `useRequestJoin()` → upsert row with `status='requested'`.
- `useToggleInterested()` → upsert/delete `status='interested'` (server-side; replaces the local-only liked list so the heart persists across devices). The spec says local-only — I will keep it server-side to match the existing app pattern; flag if you want pure localStorage instead.
- `useMyUpcomingParticipations()` → all my rows where `status in ('requested','accepted')` joined with `events` (future `starts_at` only), ordered by `starts_at`.
- `useEventParticipants(eventId)` → host view: rows joined with `profiles`.
- `useHostDecision()` → `{ participantId, decision: 'accepted'|'declined' }`.

## New component `src/components/events/ParticipantManager.tsx`
Glass sheet (same pattern as `AttendeeManager`) with two tabs: **Anfragen** / **Akzeptiert**. Each row: avatar, name, requested-at; Anfragen rows have **Annehmen** (green) / **Ablehnen** (destructive) buttons wired to `useHostDecision`. Opens from EventDetail's existing host header area as a second button "Teilnehmer" (does not remove the existing Gäste manager).

## EventDetail rewrite (action buttons only)
Replace the current `Zusagen/Absagen` + `Teilen` row with:

1. **Creator guard** — if `profile.id === event.creator_id`:
   - Hide `Gefällt mir` and `Anfragen`.
   - Show a glass card: "Du hast dieses Event erstellt" + link button "Teilnehmer verwalten" → opens `ParticipantManager`.
2. **Non-creator** — render based on `useMyParticipation`:
   - No row → two buttons: ❤️ **Gefällt mir** (toggles `interested`) and 💬 **Anfragen** (sets `requested`).
   - `interested` → heart filled + still show **Anfragen**.
   - `requested` → disabled pill **Anfrage gesendet · warte auf Bestätigung**, with a small "Zurückziehen" link.
   - `accepted` → green pill **Du bist dabei ✓**.
   - `declined` → muted pill **Anfrage abgelehnt**.
   - **Teilen** button stays.

The existing `useRSVP`/`event_attendees` calls on this page are removed from the action row, but the Zusagen-list Sheet (going avatars/progress) stays untouched.

## Anstehend tab rebuild (`src/pages/Events.tsx`)
Drop the current "show all events" content. New layout (top → bottom):

1. **Mini map** — compact 200 px Mapbox dark map (`mapbox-gl` + token already in `StuttgartMap.tsx`, extracted to a constant). Markers only for accepted participations using `events.display_lat/lng` (or `latitude/longitude` fallback). Tap pin → `navigate(/events/:id)`. No heatmap, no clustering complexity — simple purple pins. Hidden if user has zero accepted events.
2. **Section "Ausstehend"** — rows from `useMyUpcomingParticipations` where `status='requested'`. Card shows cover, name, host, datetime, sub-label "Ausstehend — warte auf Bestätigung", and a "Zurückziehen" button.
3. **Section "Zusagen"** — rows where `status='accepted'`. Tappable EventCard-style row that navigates to EventDetail.
4. Excludes events the current user created and the generic "all upcoming" feed (those move out of this tab entirely; discovery still happens on `/discover` and the map).
5. Empty state if both sections empty.

The Zusagen and Meine sibling tabs (`my-rsvps`, `my-events`) remain unchanged.

## Files
- **Create**
  - `src/hooks/useEventParticipation.ts`
  - `src/components/events/ParticipantManager.tsx`
- **Modify**
  - `src/pages/Events.tsx` — rewrite `TabsContent value="upcoming"` only.
  - `src/pages/EventDetail.tsx` — replace action buttons + add creator guard + ParticipantManager trigger.
- **Migration** — new table, RLS, helper function, enum extension, two triggers.

## Untouched
Map rendering logic, event creation, public feed/discovery, notifications drawer/bell, chat, the existing `event_attendees`/`AttendeeManager` flow.

## Open questions
1. **Profile vs Events page** — confirm rebuild on `/events` Anstehend tab (only place named "Anstehend"), or do you want a brand-new tab inside `/profile`?
2. **"Gefällt mir" persistence** — server-side (`status='interested'`, syncs across devices, hosts can see interest counts) or strictly localStorage as the spec literally says? I default to server-side; tell me to switch if not.