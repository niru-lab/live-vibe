## Teil 3/3 — OnboardingGate Status & Mini-Patch

### Befund nach Codeprüfung

`src/components/auth/OnboardingGate.tsx` erfüllt bereits den Großteil der geforderten Logik aus Teil 3:

- `ALLOWED_PREFIXES` enthält bereits `/welcome` und `/onboarding-venue` (zusätzlich zu `/auth`, `/register`, `/verify`, `/onboarding`).
- Incomplete-Profile werden bereits rollenabhängig geroutet:
  - `role === 'venue_owner'` → `/onboarding-venue`
  - sonst → `/onboarding`
- Gast-Logik unverändert: completed + auf `/` → `/feed`.

### Einzige Lücke ggü. Spec

Für `role === 'venue_owner'` mit `onboarding_complete = true` auf `/` ist noch keine Sonderbehandlung drin. Spec verlangt Redirect auf `/dashboard` (bzw. Fallback wenn nicht vorhanden).

**Aktuell existiert keine `/dashboard`-Route** (weder in `src/App.tsx` noch in `src/pages`). Damit Venue-Owner nach abgeschlossenem Onboarding nicht im Gast-Feed landen, schlage ich vor:

- Venue-Owner mit completed Onboarding auf `/` → **bleiben auf `/`** (kein Redirect zu `/feed`).
- Sobald eine echte `/dashboard`-Seite existiert, wird die Konstante `VENUE_HOME` umgestellt.

### Patch (eine Datei, ~5 Zeilen)

`src/components/auth/OnboardingGate.tsx` — `then`-Callback erweitern:

```ts
const VENUE_HOME = '/'; // später '/dashboard'

.then(({ data }) => {
  if (cancelled) return;
  setCheckedFor(user.id);
  const role = (data as any)?.role;
  if (!data || !data.onboarding_complete) {
    navigate(role === 'venue_owner' ? '/onboarding-venue' : '/onboarding', { replace: true });
  } else if (location.pathname === '/') {
    if (role === 'venue_owner') {
      if (VENUE_HOME !== '/') navigate(VENUE_HOME, { replace: true });
      // sonst auf '/' bleiben
    } else {
      navigate('/feed', { replace: true });
    }
  }
});
```

Keine weiteren Dateien betroffen. Bestehende Gast-Strecke (`/onboarding`, `/feed`, Auth-Flow, `/welcome`) bleibt 1:1.

### QA nach Patch

- Gast complete → `/feed` ✅ (unverändert)
- Gast incomplete → `/onboarding` ✅ (unverändert)
- Venue-Owner incomplete → `/onboarding-venue` ✅
- Venue-Owner complete auf `/` → bleibt auf `/` (bis `/dashboard` existiert)
- `/auth`, `/welcome`, `/onboarding-venue` bleiben ungegated ✅

### Offene Frage

Soll ich im selben Schritt eine **Placeholder-`/dashboard`-Seite** (z.B. simples „Venue Dashboard coming soon" mit Logout) anlegen und `VENUE_HOME = '/dashboard'` setzen? Oder erst später, wenn das echte Dashboard kommt?