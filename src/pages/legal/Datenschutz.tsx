import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from '@phosphor-icons/react';

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="Zurück"
        >
          <ArrowLeft weight="thin" size={20} />
        </Button>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-8 space-y-6 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <section className="space-y-2">
        <h2 className="font-semibold">1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der DSGVO ist:
        </p>
        <p>
          [GRÜNDER VOLLSTÄNDIGER NAME]<br />
          [STRASSE HAUSNUMMER]<br />
          [PLZ ORT]<br />
          E-Mail: [E-MAIL ADRESSE]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. Welche Daten wir erheben</h2>
        <p>Bei der Nutzung von Feyrn erheben wir folgende Daten:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>E-Mail-Adresse (bei Registrierung)</li>
          <li>Benutzername und Anzeigename</li>
          <li>Profilbild (optional, von dir hochgeladen)</li>
          <li>Stadt und Standortpräferenzen (von dir angegeben)</li>
          <li>Geburtsdatum (zur Altersverifizierung, insbesondere für Flirty Cards)</li>
          <li>Von dir erstellte Posts, Events und Kommentare</li>
          <li>RSVP- und Teilnahmedaten für Events</li>
          <li>Nachrichten an andere Nutzer (verschlüsselt übertragen)</li>
          <li>Interaktionsdaten (Likes, Follows, Shares)</li>
          <li>Geräteinformationen und App-Nutzungsdaten (anonymisiert)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. Zweck der Datenverarbeitung</h2>
        <p>Wir verarbeiten deine Daten für folgende Zwecke:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Bereitstellung und Betrieb der Feyrn-App</li>
          <li>Personalisierung deines Feeds und deiner Entdeckungsseite</li>
          <li>Event- und Venue-Empfehlungen basierend auf deinen Präferenzen</li>
          <li>Kommunikation zwischen Nutzern</li>
          <li>Sicherheit und Missbrauchsprävention</li>
          <li>Verbesserung der App-Funktionen (anonymisierte Nutzungsanalyse)</li>
          <li>Altersverifikation für altersabhängige Inhalte</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung deiner Daten erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung) für die Kernfunktionen der App sowie Art. 6 Abs. 1 lit. a DSGVO
          (Einwilligung) für optionale Funktionen wie Standortdienste und altersabhängige Inhalte.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">5. Datenweitergabe</h2>
        <p>
          Wir geben deine Daten nicht an Dritte zu Werbezwecken weiter. Zur technischen
          Bereitstellung der App nutzen wir folgende Dienstleister:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Supabase Inc. (Datenbankinfrastruktur, USA) — EU-Standardvertragsklauseln</li>
          <li>Mapbox Inc. (Kartendienstleistungen, USA) — EU-Standardvertragsklauseln</li>
          <li>Apple Inc. / Google LLC (App-Distribution, Push-Benachrichtigungen)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">6. Speicherdauer</h2>
        <p>
          Wir speichern deine Daten so lange, wie dein Konto aktiv ist oder wie es zur Erbringung
          unserer Dienste notwendig ist. Nach Löschung deines Kontos werden deine personenbezogenen
          Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten
          entgegenstehen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">7. Deine Rechte</h2>
        <p>Du hast gemäß DSGVO folgende Rechte:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Beschwerde bei der zuständigen Aufsichtsbehörde</li>
        </ul>
        <p>
          Zur Ausübung deiner Rechte wende dich an: [E-MAIL ADRESSE]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">8. Kontolöschung</h2>
        <p>
          Du kannst dein Konto jederzeit in den App-Einstellungen unter „Konto löschen" vollständig
          und unwiderruflich löschen. Nach der Löschung werden alle deine personenbezogenen Daten,
          Posts, Nachrichten und Profilinformationen innerhalb von 30 Tagen entfernt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">9. Minderjährige</h2>
        <p>
          Feyrn richtet sich an Nutzer ab 16 Jahren. Bestimmte Inhalte (Flirty Cards) sind nur für
          verifizierte Nutzer ab 18 Jahren zugänglich. Wir erheben wissentlich keine Daten von
          Kindern unter 16 Jahren.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">10. Cookies und lokale Speicherung</h2>
        <p>
          Die App nutzt lokalen Gerätespeicher (Local Storage) ausschließlich für technisch
          notwendige Funktionen wie die Sitzungsverwaltung und Themeeinstellungen. Es werden keine
          Tracking-Cookies oder Cross-Site-Cookies eingesetzt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">11. Standortdaten</h2>
        <p>
          Feyrn fragt optional nach deinem Standort, um Events und Venues in deiner Nähe anzuzeigen.
          Standortdaten werden nicht dauerhaft gespeichert und nicht an Dritte weitergegeben.
          Du kannst den Standortzugriff jederzeit in den Geräteeinstellungen deaktivieren.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">12. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich rechtliche
          Anforderungen oder unsere Dienste ändern. Wesentliche Änderungen teilen wir dir über
          die App mit.
        </p>
      </section>

      <p className="pt-6 text-xs text-muted-foreground">Stand: [DATUM DER LETZTEN AKTUALISIERUNG]</p>
    </LegalPage>
  );
}
