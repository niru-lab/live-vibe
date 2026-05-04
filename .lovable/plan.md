# Onboarding Flow Replacement (6-Step, Purple→Pink)

## Goal
Den bestehenden 9-Step `UserFlow.tsx` durch einen neuen 6-Step Flow nach Spec ersetzen. Eventer-Branch bleibt unverändert. Routing, Auth und `Onboarding.tsx`-Wrapper werden minimal angefasst (nur der Mount-Punkt für UserFlow).

## Was gebaut wird

### Neue Dateien
```text
src/components/onboarding/OnboardingFlow.tsx       (Wrapper, State, Step-Switch)
src/components/onboarding/ProgressBar.tsx          (Gradient-Progress + "x / 6")
src/components/onboarding/StepTransition.tsx       (Slide-in-from-right Wrapper)
src/components/onboarding/steps/StepAge.tsx        (Datepicker, 16+ Validation)
src/components/onboarding/steps/StepUsername.tsx   (Debounced Verfügbarkeit gegen profiles)
src/components/onboarding/steps/StepGenres.tsx     (Multi-Select Chips, min 1)
src/components/onboarding/steps/StepArtist.tsx     (Freitext, optional + Skip)
src/components/onboarding/steps/StepWeekend.tsx    (Single-Select Cards)
src/components/onboarding/steps/StepDrink.tsx      (Single-Select Chips, finale CTA)
```

### Geänderte Dateien (minimal)
- `src/pages/Onboarding.tsx`: User-Branch rendert `<OnboardingFlow />` statt `<UserFlow />`. Eventer-Branch + Success-Screen bleiben 1:1.

### Gelöscht
- `src/components/onboarding/UserFlow.tsx` (wird ersetzt)

`OnboardingLayout.tsx` bleibt — wird vom Eventer-Flow weiter genutzt, vom neuen User-Flow nicht.

## Design-Entscheidungen (bestätigt)

- **Gradient nur im Onboarding**: `#7C3AED → #EC4899` für Progress, CTAs, aktive Chips/Cards. Rest der App bleibt `#7F77DD`.
- **Backgrounds**: `#0A0A0F` (page), `#12121A` (cards) — nur in Onboarding-Files. Übrige App behält `#08080f` / `#111120`.
- **Inline-Styles** durchgehend (konsistent mit EventerFlow & OnboardingLayout). Keine Tailwind-Arbitrary-Values für Hex.
- **0.5px Borders** + Glassmorphism (`backdrop-blur`, `rgba(255,255,255,0.05)`).
- **Phosphor Icons** (thin 24px) für Back-Chevron, Search, Check, X — konsistent mit Iconography-Memory.

## Datenmodell & DB-Mapping

Lokaler State im Wrapper:
```ts
{ birthdate: string; username: string; genres: string[];
  artist: string; weekendType: string; drink: string }
```

Beim finalen CTA Schreibvorgang auf `profiles`:
- `username` → `username`
- `birthdate` → neues Feld `birthdate` (date) — **Migration nötig**, plus berechnetes `age` für Kompatibilität
- `genres` → `music_genres` (existiert)
- `artist` → neues Feld `favorite_artist` (text) — **Migration nötig**
- `weekendType` → `perfect_evening` (existiert, Mapping der 5 neuen Optionen)
- `drink` → `favorite_drink` (existiert)
- `onboarding_complete: true`

Felder die wegfallen (nicht mehr abgefragt, DB-Spalten bleiben aber bestehen für Eventer & Altdaten): `city`, `spot_types`, `party_vibe_score`, `persona_color`, `persona_text`. **Hinweis**: `city` wird vom Feed/Discover gebraucht — wir setzen Default `'Stuttgart'` beim Save, damit nichts bricht.

Username-Verfügbarkeit: echter Supabase-Check gegen `profiles.username` (gleiche Logik wie aktueller UserFlow), nicht nur das im Spec genannte Mock — Mock wäre Regression.

## Step-Details

| # | Titel | Pflicht | Validation |
|---|---|---|---|
| 1 | Wie alt bist du? | ja | Geburtsdatum gesetzt + Alter ≥16 |
| 2 | Wähl deinen Namen | ja | 3–20 Zeichen, `[a-z0-9_]`, Supabase-Verfügbarkeit ✓ |
| 3 | Was läuft bei dir? | ja | min. 1 Genre |
| 4 | Wer ist dein Artist? | nein | — (Skip-Link) |
| 5 | Wie verbringst du deinen Freitag? | ja | genau 1 |
| 6 | Was trinkst du so? | ja | genau 1, CTA "Feyrn starten 🔥" mit Pulse |

## Globale UI

- **ProgressBar**: `h-1`, full-width, bg `rgba(255,255,255,0.1)`, fill = linear-gradient(90deg, #7C3AED, #EC4899), `transition: width 500ms`. Counter "x / 6" oben rechts in `rgba(255,255,255,0.4)`.
- **Back**: oben links, Phosphor `CaretLeft`, ab Step 2 sichtbar, behält State.
- **StepTransition**: framer-motion `initial={{x:32,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-32,opacity:0}}`, 300ms ease-out. (framer-motion ist bereits Dependency.)
- **CTA**: `rounded-full`, gradient bg, `font-semibold`, `active:scale-95`, disabled ⇒ opacity 0.4 + cursor-not-allowed.

## Migration

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS favorite_artist text;
```
Keine RLS-Änderung — bestehende Profile-Policies decken neue Spalten ab.

## Was NICHT angefasst wird

- `src/pages/Auth.tsx`, `AuthCallback.tsx`, `AuthContext.tsx` (Step 0 wird übersprungen — Auth läuft schon vorgelagert)
- `App.tsx`, Routing
- `EventerFlow.tsx`, `OnboardingLayout.tsx`
- Bestehende DB-Spalten / RLS / Trigger
- `src/integrations/supabase/{client,types}.ts`

## Memory-Updates nach Build

1. `mem://auth/onboarding-flow` aktualisieren: User-Flow ist jetzt 6 Steps, Eventer-Flow unverändert.
2. `mem://style/visual-identity`: Notiz „Purple→Pink Gradient ausschließlich in `/components/onboarding/*` erlaubt; Rest bleibt #7F77DD ohne Gradients."

## Offen / TODO im Code
- `// TODO: optional API-Hook für Username-Reservierung mit Lock vor finalem Insert` (aktuell race-condition möglich, wie im bestehenden Flow auch).
