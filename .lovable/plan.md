# Venue-Onboarding (Teil 2/3) — Plan

## Wichtige Abweichung von der Spec (bitte bestätigen oder ich passe an)

Die `venues`-Tabelle existiert bereits, hat **134 geseedete Datensätze** und wird von `StuttgartMap`, `VenueEventSelector`, posts u.a. benutzt. Sie kann nicht neu angelegt werden. Bestehendes Schema:

- `owner_profile_id` (→ profiles.id) statt `owner_user_id` (→ auth.users)
- `latitude/longitude` statt `lat/lng`
- `address`, `city` (NOT NULL), `category` (NOT NULL), `is_verified` (bool)
- Keine Felder für venue_type, time_slots, day_pattern, offerings, price_tier, phone, whatsapp_ok, address_street, address_zip, address_skipped, verification_tier

**Vorgehen:** Bestehende Tabelle per `ALTER` erweitern, statt droppen. Ich folge zwei Lovable-Cloud-Regeln, die der Spec widersprechen:

1. **`owner_profile_id` (profiles.id)** statt `owner_user_id` (auth.users) — FK auf `auth.users` ist in Lovable Cloud verboten.
2. **`latitude/longitude`** wiederverwenden statt neuer `lat/lng`-Spalten — keine Duplikate.

Für nomadische Event-Crews muss `latitude/longitude/address/city` nullable werden. `category` bleibt NOT NULL und wird automatisch mit `venue_type` befüllt.

## Migration

```sql
-- Nullable machen für nomadische Venues
ALTER TABLE public.venues
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

-- Neue Spalten
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS venue_type TEXT,
  ADD COLUMN IF NOT EXISTS address_street TEXT,
  ADD COLUMN IF NOT EXISTS address_zip TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_slots TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS day_pattern TEXT,
  ADD COLUMN IF NOT EXISTS offerings TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_tier TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_ok BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_tier INT DEFAULT 1
    CHECK (verification_tier BETWEEN 1 AND 3);

-- RLS Policies hinzufügen (bestehende „Venues viewable by everyone" SELECT bleibt für seed-Daten)
CREATE POLICY "Owners can insert own venues" ON public.venues
  FOR INSERT WITH CHECK (
    owner_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
-- UPDATE-Policy für Owner existiert bereits.
```

Hinweis: Die bestehende `SELECT USING (true)` Policy macht *alle* Venues öffentlich lesbar — das ist für die Map gewollt und bleibt. Die geplante „nur verifiziert sichtbar"-Regel würde alle 134 Seed-Venues verstecken; deshalb übersprungen.

## Datei-Struktur (alle neu, nichts unter `src/components/onboarding/` angefasst)

```text
src/pages/OnboardingVenue.tsx              # Wrapper, State, Finish-Logik, Confetti
src/components/venue-onboarding/
  VenueOnboardingLayout.tsx                # Top-Bar (Back + 8-Step Progress), Sticky-CTA
  VenueStepTransition.tsx                  # Slide-Transition (Kopie von StepTransition)
  VenueOfferingChips.tsx                   # StaggeredChips-Variante für Step 6
  VenueMiniMap.tsx                         # Mapbox 200px, draggable Pin, Gradient
  steps/
    StepVenueType.tsx                      # 1
    StepVenueName.tsx                      # 2 (rotierender Placeholder)
    StepVenueAddress.tsx                   # 3 (mit Skip für Event-Crew + Geocoding)
    StepVenueTimeSlots.tsx                 # 4
    StepVenueDayPattern.tsx                # 5
    StepVenueOfferings.tsx                 # 6
    StepVenuePriceTier.tsx                 # 7
    StepVenueContact.tsx                   # 8 (Telefon + WhatsApp Toggle)
```

## Routing

- Neue Route `/onboarding-venue` → `OnboardingVenue`
- `OnboardingGate`: Wenn `profiles.role === 'venue_owner'` UND `onboarding_complete === false` → redirect auf `/onboarding-venue` (statt `/onboarding`). Gast-Branch bleibt 1:1.
- `/onboarding-venue` zur `ALLOWED_PREFIXES` ergänzen.

## Step-Verhalten

- Single-Select Steps (1, 5, 7): Tap auf Karte selektiert + advanciert nicht automatisch — Sticky-CTA „Weiter" aktiviert sich.
- Multi-Select (4, 6): mind. 1 Pflicht, max 8 bei Offerings.
- Step 2: Placeholder rotiert per `setInterval` alle 3s durch 4 Beispiele.
- Step 3: Wenn `venue_type === 'event_crew'` (Wert aus Step 1) → Skip-Button sichtbar. Sobald Straße + 5-stellige PLZ + Stadt befüllt → debounced (800ms) Mapbox-Geocode → Mini-Map mit draggable Pin rendert. Drag-End updated lokalen state.
- Step 8: DE-Regex Validierung, WhatsApp-Toggle.

## Finish-Logik

1. `supabase.from('venues').insert({...})` mit:
   - `owner_profile_id` (profiles.id des eingeloggten Users)
   - `name`, `venue_type`, `category: venue_type` (damit NOT NULL erfüllt)
   - `address_street`, `address_zip`, `address_city`, `address_skipped`
   - `address = "<street>, <zip> <city>"` (falls nicht skipped, für Bestandscode-Kompatibilität)
   - `city = address_city`
   - `latitude/longitude` (aus Geocode/Drag, oder NULL bei skipped)
   - `time_slots`, `day_pattern`, `offerings`, `price_tier`, `phone`, `whatsapp_ok`
   - `verification_tier: 1`
2. `profiles.update({ onboarding_complete: true })`
3. Confetti (`canvas-confetti` falls vorhanden, sonst CSS-Pulse) + Toast „Willkommen bei Feyrn! Dein Spot ist drin 🔥"
4. Redirect `/` → OnboardingGate schickt weiter zu `/feed` (Dashboard kommt in Teil 3)

## Validierungen (zod)

- Name: 2–60 Zeichen
- PLZ: `/^\d{5}$/`
- Phone: `/^(\+49|0)[1-9][0-9]{8,11}$/`
- Offerings: 1–8 Einträge

## Design-Tokens

Trotz Spec-Hex-Werten (#0A0A0F, #12121A, #7C3AED→#EC4899) verwende ich die bestehenden semantischen Tokens (`bg-background`, `bg-card/80`, `border-border/50`, `primary`→`accent`-Gradient), damit das visuelle System konsistent mit Gast-Onboarding und Welcome-Screen bleibt.

## Bestätigung gewünscht

Falls du die Spec-Schema-Punkte (eigene `lat/lng`-Spalten, FK auf `auth.users`, „nur verifiziert sichtbar"-Policy) zwingend so willst, sag Bescheid — dann besprechen wir Migrationsweg ohne Datenverlust.