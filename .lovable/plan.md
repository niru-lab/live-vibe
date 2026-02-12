

# Feed-Algorithmus fuer Feyrn

## Uebersicht

Ein einfacher, clientseitiger Ranking-Algorithmus der Posts im Feed nach Relevanz sortiert. Kein Over-Engineering -- alles laeuft im Frontend mit den bereits vorhandenen Daten.

## Wie der Algorithmus funktioniert

Jeder Post bekommt einen Score aus diesen Faktoren:

| Faktor | Was wird gemessen | Punkte |
|--------|------------------|--------|
| Aktualitaet | Wie neu ist der Post | 0-50 (neuer = mehr) |
| Engagement | Likes + Kommentare des Posts | Likes x2 + Kommentare x3 |
| Autor-Popularitaet | Follower-Anzahl + Social Cloud Points | Skaliert bis max 30 |
| Follower-Boost | Folgt der User dem Autor? | +25 Bonus |
| Beliebter Ort | Posts von Orten mit vielen Posts | +15 Bonus |
| Moment-X | Ist es ein Moment-X Post? | +20 Bonus |
| Musik | Hat der Post Musik? | +5 Bonus |

Posts werden nach diesem Gesamt-Score sortiert angezeigt.

## Technische Umsetzung

### 1. Neuer Hook: `src/hooks/useFeedAlgorithm.ts`

Ein eigener Hook der die Ranking-Logik kapselt:
- Nimmt die rohen Posts, User-Likes und Follow-Daten
- Berechnet pro Post einen Score
- Gibt die sortierte Liste zurueck

### 2. Anpassung: `src/pages/Feed.tsx`

- Nutzt den neuen `useFeedAlgorithm` Hook
- Laedt zusaetzlich die Follow-Liste des Users (welchen Profilen folgt man)
- Uebergibt alles an den Algorithmus

### 3. Anpassung: `src/hooks/usePosts.ts`

- Erweiterung der `usePosts` Query um Follower-Count des Autors mitzuladen (via Subquery oder separate Abfrage)

### 4. Neuer Hook-Abschnitt: Follow-Liste laden

- Nutzt bestehenden `useFollowStats` bzw. eine einfache Query um zu pruefen welchen Profilen der aktuelle User folgt

### Score-Berechnung (Pseudocode)

```text
score = 0

-- Aktualitaet (exponentieller Abfall)
minutenAlt = (jetzt - post.created_at) in Minuten
score += max(0, 50 - (minutenAlt / 60))

-- Engagement
score += post.likes_count * 2
score += post.comments_count * 3

-- Autor Popularitaet (gedeckelt)
score += min(30, autor.social_cloud_points / 10)

-- Folge ich dem Autor?
if ich_folge_autor: score += 25

-- Beliebter Ort (gleicher location_name zaehlen)
if location_hat_mehrere_posts: score += 15

-- Moment-X Bonus
if post.is_moment_x: score += 20

-- Musik Bonus
if post.music_url: score += 5
```

### Dateien die erstellt/geaendert werden

| Datei | Aktion |
|-------|--------|
| `src/hooks/useFeedAlgorithm.ts` | Neu -- Score-Berechnung und Sortierung |
| `src/pages/Feed.tsx` | Aendern -- Algorithm-Hook einbinden |
| `src/components/discover/DiscoverGrid.tsx` | Aendern -- gleichen Algo auch dort nutzen |

Keine Datenbank-Aenderungen noetig. Alles laeuft mit den vorhandenen Daten clientseitig.

