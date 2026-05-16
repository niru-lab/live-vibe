## Fix scope

Chat module only: `src/pages/Messages.tsx`, `src/components/messaging/SendMessageDialog.tsx`, `src/hooks/useDirectMessages.ts`, plus one new hook `src/hooks/useChatRequest.ts`. Map, events, notifications, profile tabs are not touched.

## Bug 1 — Dark/Light theme

`tailwind.config.ts` already has `darkMode: ["class"]` and a `ThemeProvider` toggles the class on `<html>`. Chat files use hardcoded hex everywhere (`bg-[#0A0A0F]`, `bg-[#12121A]`, `text-white`, `text-[#A0A0B0]`, `bg-white/[0.06]`, etc.), so light mode looks broken.

Fix by replacing every hardcoded color with a `dark:` variant pair per spec:

- Page shell / header: `bg-[#F5F5F7] dark:bg-[#0A0A0F]`, border `border-gray-200 dark:border-white/10`
- Card backgrounds (chat list items, request cards, skeleton): `bg-white dark:bg-[#12121A]` + `border-gray-200 dark:border-white/10`
- Primary text: `text-[#0A0A0F] dark:text-white`; muted text: `text-gray-500 dark:text-[#A0A0B0]`
- Tab pills: active gradient stays (brand); inactive `bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-[#A0A0B0]`
- Conversation modal:
  - container `bg-white dark:bg-[#12121A]`
  - own bubble `bg-purple-100 text-purple-900 dark:bg-purple-600 dark:text-white`
  - other bubble `bg-white text-gray-900 border border-gray-200 dark:bg-white/10 dark:text-white dark:border-transparent`
  - input area `bg-white border-gray-200 dark:bg-white/5 dark:border-white/10`, textarea same, placeholder `placeholder:text-gray-400 dark:placeholder:text-[#A0A0B0]`

No design tokens added — straight Tailwind `dark:` variants per the spec.

## Bug 2 — Accept once, chat forever

### New table `chat_requests` (only schema change)

```sql
create table public.chat_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,        -- profiles.id (matches existing pattern; not auth.users)
  recipient_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique(sender_id, recipient_id)
);
alter table public.chat_requests enable row level security;
-- SELECT: either side via profiles lookup of auth.uid()
-- INSERT: sender_id maps to auth.uid()
-- UPDATE: recipient_id maps to auth.uid() (accept/decline)
```

Note: spec says `references auth.users`, but the rest of the project consistently uses `profiles.id` for user references — I'll use `profiles.id` to match `direct_messages.sender_id/recipient_id` so joins work. Confirm if you prefer literal `auth.users`.

Helper SQL function `chat_request_status(a uuid, b uuid)` (SECURITY DEFINER) returning the canonical status for the pair (checks both directions). Used by client and to short-circuit when mutual follow exists.

### Hook `useChatRequest.ts`

- `useChatRequestStatus(otherProfileId)` → `{ status: 'none'|'pending_outgoing'|'pending_incoming'|'accepted'|'declined', mutualFollow: boolean, requestId? }`. Combines `chat_requests` row + mutual-follow check on `follows`.
- `useAcceptChatRequest(id)` / `useDeclineChatRequest(id)` mutations.
- `useEnsureChatRequest()` — called from `useSendDM` before insert: if mutual follow → auto-create row with `status='accepted'`; else upsert pending row (no-op if exists).

### `useDirectMessages.ts` changes

- `useSendDM`: before inserting message, call ensure-request. If status is `pending_outgoing` or new → still insert message (it shows as pending). If status `declined` and not recipient-initiated → throw error "Anfrage wurde abgelehnt".
- Add `useConversations()` selector that groups DMs by other-user (one row per partner, latest message) instead of one row per message. The existing list returns flat messages — that's why each looks like its own request.

### `Messages.tsx` (chat list)

- Replace per-message rendering with per-conversation rendering using `useConversations()`.
- "Chats" tab: conversations where `chat_requests.status='accepted'` OR mutual follow OR I am the sender (outgoing pending shown with "warte auf Bestätigung" subtitle).
- "Anfragen" tab: conversations where I am recipient and status is `pending` (one entry per sender, not per message). Accept/Decline buttons call the new mutations and update the request row, not the message.
- Tapping a conversation opens `SendMessageDialog` (modal stays as the chat surface) — already supports per-pair filtering.

### `SendMessageDialog.tsx` (conversation view)

- Read `useChatRequestStatus(recipient.id)`.
- If `status === 'pending_incoming'` (I'm recipient, not yet accepted): show banner at top "{display_name} möchte mit dir schreiben" with Annehmen / Ablehnen. Render messages below as greyed-out (`opacity-60`), input disabled.
- If `status === 'pending_outgoing'`: input enabled (so they can keep typing additional intro messages) but show small note "Nachricht gesendet — warte auf Bestätigung". Per spec the first send already triggers notification.
- If `status === 'declined'` and I'm sender: input disabled, banner "Anfrage wurde abgelehnt".
- If `accepted` or `mutualFollow`: normal chat, input unlocked both ways.
- Light/dark fixes from Bug 1 applied here too.

### Notifications

A `message_request` notification is already created by the existing `notify_on_first_dm` trigger. No new notification logic needed — the chat_request row is just the gate for the input.

## Files

Modify:
- `src/pages/Messages.tsx`
- `src/components/messaging/SendMessageDialog.tsx`
- `src/hooks/useDirectMessages.ts` (add `useConversations`, gate `useSendDM`)

Create:
- `src/hooks/useChatRequest.ts`
- migration: `chat_requests` table + RLS + `chat_request_status` helper

Out of scope: notification table, events, map, profile, anything else.

## Open question

The spec literally says `sender_id uuid references auth.users`. The existing chat (`direct_messages`, `follows`, `profiles`) all reference `profiles.id`, which makes joins and RLS simple. I'll use `profiles.id` for consistency unless you tell me to use `auth.users`.