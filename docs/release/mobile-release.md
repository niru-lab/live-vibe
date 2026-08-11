# Feyrn Mobile Release Guide (Capacitor iOS + Android)

Status: **Release Candidate — NO-GO** until the blockers in section 9 are closed.
Last updated: 2026-08-11

---

## 1. Build & release commands

```bash
npm install
npm run lint        # currently reports pre-existing `any` violations (see §9)
npm run build       # Vite production build -> dist/  (passes)
npx cap sync        # copies dist/ into the native projects (passes)

# one-time, run locally (native folders are NOT in this repo/sandbox):
npx cap add ios
npx cap add android

npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

Local hot-reload against the Lovable sandbox (development only, never release):

```bash
CAP_SERVER_URL="https://9f6d8b6f-42e5-46a3-b92c-0b1a93b59e9d.lovableproject.com?forceHideBadge=true" npx cap sync
```

`capacitor.config.ts` only sets `server.url` when `CAP_SERVER_URL` is present, so
release builds always load the bundled `dist/` assets.

---

## 2. Capacitor configuration summary

| Setting | Value |
| --- | --- |
| appName | `Feyrn` |
| appId | `app.lovable.9f6d8b6f42e546a3b92c0b1a93b59e9d` (**placeholder — blocker**) |
| webDir | `dist` |
| server.url | none in production (env-gated dev override only) |
| SplashScreen | auto-hide after 1200 ms, `#08080F`, no spinner — cannot block startup |
| StatusBar | dark style, `#08080F`, does not overlay the webview |
| Keyboard | `resize: native`, resizes on full screen |
| iOS | `contentInset: always` (safe areas), app-bound domains off |
| Android | `allowMixedContent: false` |

The web app already ships `viewport-fit=cover` plus `env(safe-area-inset-*)`
padding in `AppLayout`, so notch/gesture areas are handled.

---

## 3. iOS configuration checklist (after `npx cap add ios`)

- Bundle ID: must match `appId` above (final ID pending — blocker).
- Version (`CFBundleShortVersionString`) / build (`CFBundleVersion`): set per release, start `1.0.0` / `1`.
- Signing: Apple Developer team, automatic signing for TestFlight.
- Info.plist permission strings: see `ios-permissions.md` (location, camera, photo library).
  Remove `NSUserTrackingUsageDescription` — no tracking SDK is present.
- Do **not** enable the Push Notifications capability for this release (push is paused).
- App icon + splash: generate from `public/icon-512.png` (`@capacitor/assets`).
- Associated Domains: only if universal links are added later — not implemented today.

## 4. Android configuration checklist (after `npx cap add android`)

- `applicationId` must match `appId` above.
- `versionName` `1.0.0`, `versionCode` `1`.
- Signing: upload keystore + Play App Signing.
- `AndroidManifest.xml` permissions (added by the plugins, verify nothing extra):
  `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `CAMERA`,
  `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO`. Remove `POST_NOTIFICATIONS` while push is paused.
- No advertising ID permission, no tracking SDKs.
- Data Safety form: collected data = account info (email), user content (posts/photos),
  approximate location (optional, in-app only), app interaction analytics. No data sold.
  Account deletion URL: `https://<production-domain>/konto-loeschen`.

---

## 5. Environment variables

All `VITE_*` variables are **public** — they are inlined into the client bundle.
Security relies on Supabase RLS, not on hiding these values.

| Variable | Public? | Used by | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | public | `src/integrations/supabase/client.ts` | backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | public | same | anon key |
| `VITE_SUPABASE_PROJECT_ID` | public | tooling | |
| `VITE_MAPBOX_TOKEN` | public | `src/lib/mapbox.ts` | restrict by URL/bundle-ID allow-list in the Mapbox account |
| `VITE_SITE_URL` | public | `src/lib/appUrl.ts` | canonical https origin used for auth redirects and share links inside the native shell |

Server-side only, never in the client bundle and never in Git:
`SUPABASE_SERVICE_ROLE_KEY`, database password, `FCM_SERVICE_ACCOUNT_JSON`,
`TEST_SEED_SECRET`, any signing keys. Verified: the production bundle contains
none of these strings.

---

## 6. Permission behaviour

| Permission | When requested | Denial behaviour |
| --- | --- | --- |
| Location | only via `useNativeFeatures().getCurrentPosition()`, triggered by user action; never at launch | returns `null`; Discover/Map keep working through city + genre filters and manual search |
| Camera | only when the user starts a photo/video action (`takePhoto`) | Capacitor throws, caught by the caller; file/gallery upload remains available |
| Photo library | only on media picking (`pickFromGallery`) | picker cancels, no crash |
| Notifications | **not requested** — `initPushNotifications()` only runs on native and push delivery is paused; no prompt is triggered while FCM is unconfigured | n/a |
| Tracking / IDFA | not used | n/a |

Push infrastructure (`push_tokens`, `push_sends`, `_shared/push.ts`, `_shared/fcm.ts`)
is untouched and stays fail-safe: without `FCM_SERVICE_ACCOUNT_JSON`,
`fcmConfigured()` is false and sends are recorded as `skipped_no_provider`.

---

## 7. Auth & deep links

- All auth redirects now go through `appUrl()` (`src/lib/appUrl.ts`) instead of
  `window.location.origin`. Inside the native shell the origin is
  `capacitor://localhost`, which Supabase would reject — `VITE_SITE_URL` is used there.
- Affected call sites: `AuthContext.signUp`, `Auth`, `Register`, `Verify`, `Welcome`
  (Google/Apple OAuth), `useReferral` share links.
- Universal Links / App Links are **not** implemented. Auth and share links open in
  the system browser and complete there; the app itself keeps its session via
  localStorage (`persistSession: true`, `autoRefreshToken: true`). Document this
  limitation in store review notes.

## 8. Account deletion

- In-app: Profile → Einstellungen → Privacy-Einstellungen → „Konto endgültig löschen".
- Flow: reason → password re-authentication → confirmation → `delete-account` edge function.
- `delete-account` verifies the caller's JWT, runs `public.purge_user_data(uuid)`
  (service-role only, security definer) and then deletes the auth user.
- Purged: profile, posts, comments, likes, follows, RSVPs, event participants,
  events and Roomz created by the user, direct/event messages, chat requests,
  notifications, blocks, reports filed, privacy settings, push preferences/tokens/sends,
  referral rows, point ledger and Social Cloud points, offer activations, venue offers.
- Public web resource (Google Play requirement): `/konto-loeschen`.
- Account *deactivation* was previously a non-functional button and has been removed
  rather than shipped as a fake flow.

---

## 9. Open release blockers

1. **Bundle identifier** is still the Lovable placeholder
   `app.lovable.9f6d8b6f42e546a3b92c0b1a93b59e9d`. Decide the final reverse-DNS ID
   (e.g. `de.feyrn.app`) before creating the App Store Connect / Play Console entries —
   it cannot be changed after the first upload.
2. **Native projects do not exist yet** (`ios/`, `android/`). They must be generated and
   committed/built on a local machine; icons, splash, signing and store builds cannot be
   validated in this environment.
3. **`npm run lint` fails** with 136 pre-existing `@typescript-eslint/no-explicit-any`
   errors across existing product code (plus Deno edge functions). TypeScript compilation
   and the production build pass. Cleanup is a separate task — fixing it here would touch
   business logic that is out of scope.
4. **Device QA not executed** — no simulator/emulator/physical device is available in this
   environment. The full matrix in the release brief (guest flow, venue flow, failure
   states, map/RSVP, background resume) must be run manually before submitting.
5. **Legal texts unreviewed** — Impressum, AGB, Datenschutz and the new
   Community-Richtlinien exist but have not been legally reviewed. Confirm the production
   domain in `VITE_SITE_URL` and in the store listings.
