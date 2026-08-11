# Native Permissions & Capabilities (iOS + Android)

Status: **specification only** — `ios/` and `android/` do not exist in this repo yet.
Nothing here is active until someone runs `npx cap add ios` / `npx cap add android`
locally and applies the values below. Do not claim store readiness before that.

Permissions are derived from the code that actually uses native APIs
(`src/hooks/useNativeFeatures.ts`): Camera, Photo Library, Geolocation (when-in-use).
No tracking/IDFA, no background location, no microphone, no contacts.

## iOS — `ios/App/App/Info.plist`

Insert before the closing `</dict>`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Feyrn zeigt dir Events und Locations in deiner Nähe auf der Karte.</string>

<key>NSCameraUsageDescription</key>
<string>Feyrn nutzt die Kamera, damit du Fotos für Beiträge und dein Profilbild aufnehmen kannst.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Feyrn greift auf deine Fotos zu, damit du Bilder für Beiträge und dein Profilbild auswählen kannst.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Feyrn speichert Bilder, die du erstellst, in deiner Fotomediathek.</string>
```

Do **not** add `NSUserTrackingUsageDescription` — the app runs no cross-app
tracking and no ad SDK. Adding it triggers an ATT review question that cannot be
justified.

Do **not** add `NSLocationAlwaysAndWhenInUseUsageDescription` — only
when-in-use location is requested.

## iOS capabilities (Xcode → Signing & Capabilities)

- Push Notifications: **not enabled** — push delivery is intentionally paused
  (no FCM provider configured). Enable only when push is reactivated.
- Associated Domains (deep links, optional): `applinks:www.feyrn.de`, and host
  `https://www.feyrn.de/.well-known/apple-app-site-association` with the real
  Team ID and final bundle ID.

## Android — `android/app/src/main/AndroidManifest.xml`

Required inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

Explicitly remove permissions merged in by unused plugins:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" tools:node="remove" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" tools:node="remove" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" tools:node="remove" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" tools:node="remove" />
```

(`xmlns:tools="http://schemas.android.com/tools"` must be present on `<manifest>`.)

`POST_NOTIFICATIONS` stays removed while push is paused; re-add it in the same
change that re-enables push.

## Play Data safety / App privacy answers

- Location (approximate + precise): collected, used for app functionality
  (event discovery), not shared, not used for tracking.
- Photos/Videos: user-provided content, uploaded to the backend, tied to the
  account, deletable via in-app account deletion.
- Email address / user IDs: account management, deletable.
- No advertising, no third-party ad networks, no data sold.
- Account deletion: in-app under Profil → Einstellungen → Datenschutz, plus the
  public web page `/konto-loeschen`.
