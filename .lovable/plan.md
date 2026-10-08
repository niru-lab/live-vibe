# Prompt 3: Social-Layer, Posts, Sicherheit, Push vorbereiten

## Bewertung vorab

Die meisten Teile aus Prompt 3 gibt es schon und sie hängen bereits an der Datenbank:

- **Posts:** `posts`, `post_media`, `likes`, `comments`
- **Chat:** `direct_messages` mit Nachrichtenanfragen über `chat_requests`, mit Live-Updates
- **Roomz:** `rooms`, `room_members`, `room_posts`
- **Sicherheit:** `blocks`, `reports` und das Drei-Punkte-Menü (`SafetyMenu`)
- **Push:** `push_tokens`, `push_preferences`, die Edge Function `push-lifecycle` und das Capacitor-Push-Paket

Würde ich die Tabellen aus dem Prompt neu anlegen (`post_likes`, `post_comments`, `conversations`, `messages` usw.), gäbe es alles doppelt. Feed, Chat und Roomz würden brechen.

**Vorgehen:** Ich ergänze nur, was fehlt, und benenne nichts um.

## Was gebaut wird

**1. Posts / Vibe-Checks**
- Neue Felder an `posts`: Crowd (1–5), Stimmung (1–5), Musik passt (ja/nein), „Vor Ort“ geprüft, Posten als Venue.
- Prüfung „Vor Ort“: Der Server prüft beim Posten mit Venue-Tag, ob der Standort höchstens 200 m von der Venue entfernt ist. Wenn ja, bekommt der Post das Badge „Vor Ort“. Der Client kann dieses Feld nicht selbst setzen.
- Posten als Venue: Das geht nur für eigene Venues und wird vom Server geprüft. Der Verified-Haken erscheint, wenn die Venue freigegeben ist.
- Im Post-Formular: optionale Bewertungen als gut sichtbare Chips, Schalter „Als Venue posten“ für Venue-Mitglieder und Abfrage des Standorts nur bei getaggter Venue.
- Likes und Kommentare bleiben wie bisher.

**2. Feed**
- Endloses Nachladen statt fester Liste.
- Filter-Chips: Alle / Meine Stadt / Vor Ort.
- Autoren gebündelt in einer Abfrage.
- Ranking und Nudges bleiben unverändert.

**3. Messages**
- Bleibt technisch wie es ist (Anfrage, Annahme, Chat, Live-Updates).
- Ich prüfe, ob der Server Folgenachrichten vor der Annahme wirklich verbietet. Fehlt das, ergänze ich es in den Regeln für `direct_messages`.

**4. Roomz**
- Keine Änderung. Live-Updates im Raum ergänze ich nur, falls sie fehlen.

**5. Sicherheit**
- Blockierte Nutzer: Ich prüfe, ob Posts, Kommentare, Chats und Raumbeiträge serverseitig ausgeblendet werden, und ergänze fehlende Stellen.
- Das Drei-Punkte-Menü sicherstellen bei Posts, Profilen und Nachrichten.
- Neue Admin-Seite `/admin/reports`: Meldungen ansehen und einen Post ausblenden. Das Ausblenden markiert den Post als gelöscht und läuft über eine reine Admin-Funktion.
- Meldungen werden als erledigt oder verworfen markiert.

**6. Cards**
- Keine Änderung, die Daten kommen bereits aus Profil und Präferenzen.

**7. Push (nur die App-Seite)**
- Die Berechtigung wird nicht beim Start abgefragt. Nach der ersten Zusage erscheint einmalig der Hinweis „Sollen wir dich erinnern, wenn's losgeht? 🔔“. Bei „Ja“ kommt die Abfrage des Handys, danach wird das Token gespeichert. Das passiert nur auf iOS und Android.
- Bestehende `push_preferences` um drei Schalter erweitern: Event-Erinnerungen, Nachrichten, Freunde gehen hin. Die Einstellungen liegen im Profil. Keine zweite Tabelle `notification_preferences`.
- In `push-lifecycle` kommen drei Auslöser dazu: Event startet in 2 Std., neue Nachricht, Anfrage angenommen. Die Präferenzen und die bestehenden Ruhezeiten werden beachtet.
- Für den Versand braucht es die Secrets APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID und FCM_SERVER_KEY, nur als Platzhalter.
- Solange diese Secrets fehlen, versendet die Funktion nichts und protokolliert nur. Das passt zum aktuellen Stand, dass Push pausiert ist.

## Bleibt unverändert

Rollen, Venues, Events, Zusagen, Onboarding, Login, Cards und das Design.

## Technische Details

- **Migration (nur ergänzend):**
  - `posts` bekommt `crowd_level` und `mood` (smallint 1–5, Prüfung beim Speichern), `music_fit`, `on_site_verified` (Standard false) und `posted_as_venue_id` (Verweis auf `venues`).
  - Ein Trigger setzt `on_site_verified` beim Einfügen auf false. Nur die neue Funktion `verify_post_location(post_id, lat, lng)` setzt es auf true, wenn der Abstand zur Venue höchstens 200 m beträgt (Haversine-Formel).
  - Die INSERT-Regel für `posts` wird ergänzt: `posted_as_venue_id IS NULL OR is_venue_member(posted_as_venue_id)`.
  - `push_tokens.last_seen` kommt dazu, falls es fehlt. `push_preferences` bekommt `event_reminders`, `messages` und `friends_going` (Standard true).
  - Neue Admin-Funktionen `admin_hide_post` und `admin_resolve_report`. SELECT auf `reports` für Admins über `has_role`.
- **Feed:** `useInfiniteQuery` mit Cursor über `created_at`. Der Filter „Vor Ort“ nutzt `on_site_verified = true`, „Meine Stadt“ nutzt `profile.city`.
- **Push-Hinweis:** Ein Merker in `localStorage`, ob der Hinweis schon gezeigt wurde. Wird beim ersten erfolgreichen RSVP ausgelöst und nur gezeigt, wenn `Capacitor.isNativePlatform()` zutrifft.
- **Zuerst prüfen:** die bestehenden Regeln für `direct_messages`, `comments`, `room_posts` und `likes` auf Block-Prüfung und Annahme-Pflicht. Ergänzt wird nur, was die Prüfung als fehlend zeigt.
