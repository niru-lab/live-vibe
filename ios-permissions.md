# iOS Info.plist – Permission Strings

Nach `npx cap add ios` diese Keys in `ios/App/App/Info.plist` einfügen (vor dem schließenden `</dict>`). Ohne diese Strings **crasht die App** beim ersten Zugriff und Apple lehnt beim Review ab.

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Feyrn zeigt dir Events in deiner Nähe.</string>

<key>NSCameraUsageDescription</key>
<string>Feyrn braucht Zugriff auf deine Kamera für Profilbilder und Event-Posts.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Feyrn braucht Zugriff auf deine Fotos, damit du sie als Profilbild oder in Posts verwenden kannst.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Feyrn möchte gespeicherte Bilder in deiner Galerie ablegen.</string>

<key>NSUserTrackingUsageDescription</key>
<string>Feyrn nutzt dies nur zur Verbesserung der Event-Empfehlungen.</string>
```

## Push Notifications
Zusätzlich in Xcode aktivieren:
1. Target „App" → **Signing & Capabilities** → **+ Capability** → **Push Notifications**
2. **+ Capability** → **Background Modes** → Haken bei **Remote notifications**

## Associated Domains (Deep Links)
Wenn du deine gekaufte Domain nutzt (bitte Domainname bestätigen):
1. **+ Capability** → **Associated Domains**
2. Eintrag hinzufügen: `applinks:deine-domain.de`
3. Auf dem Server unter `https://deine-domain.de/.well-known/apple-app-site-association` folgende JSON hosten:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.app.lovable.9f6d8b6f42e546a3b92c0b1a93b59e9d",
      "paths": ["/event/*", "/roomz/*", "/u/*", "/invite/*"]
    }]
  }
}
```
