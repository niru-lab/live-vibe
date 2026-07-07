import { Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';

// TODO: Platzhalter-Datenschutzerklärung. Vor Release final durch Anwalt / Generator (z.B. eRecht24) prüfen.
export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <CaretLeft weight="thin" size={20} /> Zurück
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 space-y-6 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">Datenschutzerklärung</h1>

        <section className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Platzhalter. Vor App-Store-Einreichung durch finalen Text (Firmierung, Auftragsverarbeitungsverträge, konkrete Subprozessoren) ersetzen.
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung ist:<br />
            [Firmenname / Inhaber]<br />
            [Anschrift]<br />
            E-Mail: [kontakt@feyrn.de]
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">2. Erhobene Daten</h2>
          <p>Bei der Nutzung von Feyrn verarbeiten wir folgende personenbezogene Daten:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Registrierung: E-Mail, Passwort (gehasht), Username, Anzeigename, Alter, Stadt</li>
            <li>Profildaten: Musikgenres, Lieblingsartist, Getränk, Wochenendtyp, Profilbild</li>
            <li>Nutzungsdaten: Erstellte Posts, Events, Roomz, Kommentare, Likes, Follows</li>
            <li>Standortdaten (nur nach Freigabe): grobe Position zur Anzeige nahegelegener Events</li>
            <li>Kommunikation: Direktnachrichten, Event-Chats, Push-Token</li>
            <li>Technische Daten: IP-Adresse, Gerätetyp, App-Version</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">3. Zwecke und Rechtsgrundlagen</h2>
          <p>
            Bereitstellung der App-Funktionen (Art. 6 Abs. 1 lit. b DSGVO), Sicherstellung des Betriebs und Missbrauchsprävention
            (Art. 6 Abs. 1 lit. f DSGVO), Einwilligung bei Push / Standort (Art. 6 Abs. 1 lit. a DSGVO).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">4. Empfänger / Auftragsverarbeiter</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supabase (Hosting, Auth, Datenbank) – [AV-Vertrag]</li>
            <li>Mapbox (Kartendarstellung)</li>
            <li>Apple / Google (Push-Benachrichtigungen)</li>
            <li>[weitere Dienste ergänzen]</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">5. Speicherdauer</h2>
          <p>
            Account-Daten bis zur Löschung des Kontos. Zeitlich begrenzte Inhalte (Moment X, Event-Posts) automatisch nach 24 h.
            Chat-Nachrichten bis zur Löschung durch den Nutzer oder Account-Löschung.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">6. Deine Rechte</h2>
          <p>
            Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Beschwerde bei der zuständigen
            Aufsichtsbehörde. Kontakt: [kontakt@feyrn.de]. Account-Löschung erfolgt in-app unter Profil → Einstellungen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">7. Push-Benachrichtigungen und Standort</h2>
          <p>
            Werden nur nach ausdrücklicher Zustimmung im Betriebssystem verwendet und können jederzeit in den Systemeinstellungen widerrufen werden.
          </p>
        </section>

        <p className="pt-6 text-xs text-muted-foreground">Stand: [Datum]</p>
      </main>
    </div>
  );
}
