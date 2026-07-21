# Phase 2 RLS — Status & bekannte Aggregat-Leaks

Stand: Juli 2026. Phase 2 (Server-side Hard-Block + Privacy Enforcement via RLS)
ist abgeschlossen für:

- `profiles` (SELECT)
- `posts` (SELECT)
- `follows` (SELECT)
- `comments` (SELECT)
- `likes` (SELECT)

Zentraler Helper: `public.can_see_user(viewer_id, target_id)` kombiniert
`can_view_profile` (Privacy: public / followers / self) mit bidirektionalem
`is_blocked`. Alle fünf Policies nutzen ihn konsistent.

## Bekannte Aggregat-Leaks (bewusst offen gelassen)

RLS filtert Rows, nicht denormalisierte Zähler. Folgende Aggregate können
Informationen über sonst versteckte Rows preisgeben:

| Feld                          | Tabelle    | Trigger                              | Leak |
|-------------------------------|------------|--------------------------------------|------|
| `posts.likes_count`           | `posts`    | `update_post_likes_count`            | Zählt auch Likes von blockierten oder followers-only Usern für Fremde. Row selbst ist unsichtbar, Anzahl weicht ab. |
| `posts.comments_count`        | `posts`    | `update_post_comments_count`         | Wie oben für Kommentare. |
| `profiles.social_cloud_points`| `profiles` | `update_social_cloud_points`         | Punkte-Delta durch versteckte Likes/Follows/Posts fließen weiterhin ein. |
| `user_points.points/level`    | `user_points` | `add_points` via App-Logik        | Analog zu SC-Points. |
| Follower-/Following-Counts    | (client)   | Client-`count()` auf `follows`       | Client-Aggregate respektieren RLS und sind konsistent; server-seitige Counter existieren nicht. |

### Warum akzeptiert
- Kein Preisgeben von Identitäten oder Inhalten, nur einer Zahl.
- Fix erfordert entweder RLS-Aware-Materialized-Views oder On-Read-Aggregation
  über SECURITY-DEFINER-Funktionen — beides ist Phase 3+ Scope.
- Alternative (Trigger auf Block/Privacy-Änderungen umrechnen) skaliert schlecht
  und wurde bewusst verschoben.

### Zusatz-Hinweise
- `notifications.notify_on_*` respektiert Blocks via `create_notification`, aber
  historische Notifications werden nicht rückwirkend gelöscht.
- Anon-Zugriff: Sieht weiterhin public Profile, public Posts von public Autoren
  und deren Likes/Comments von public Autoren — via `can_view_profile(NULL, …)`
  Fallback auf `profile_visibility='public'`.

## Nicht in Phase 2 enthalten (→ Phase 3)

- `user_points`, `point_ledger`, `profiles.*_count` Zähler-Reparatur
- `rooms`, `room_members`, `room_posts` Block-/Privacy-Enforcement
- `events`, `event_attendees`, `event_participants`, `event_invites`
- `direct_messages`, `chat_requests`, `message_reads`
- `notifications` (historische Löschung / Filter beim Lesen)
- Discover-Aggregate (`hotspot_cells`, Map-Marker) und Feed-Ranking
