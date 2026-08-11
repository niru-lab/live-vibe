import { Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';

/**
 * Public web resource for account & data deletion.
 * Required by Google Play (Data Safety) and reachable without being logged in.
 */
export default function KontoLoeschen() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <CaretLeft weight="thin" size={20} /> Zurück
        </Link>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-5 py-8 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">Konto und Daten löschen</h1>

        <section className="space-y-2">
          <h2 className="font-semibold">In der App löschen</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Feyrn öffnen und anmelden</li>
            <li>Profil → Einstellungen → Privacy-Einstellungen</li>
            <li>„Konto endgültig löschen" wählen</li>
            <li>Grund angeben, Passwort bestätigen und Löschung bestätigen</li>
          </ol>
          <p>Die Löschung erfolgt sofort. Danach ist keine Anmeldung mehr möglich.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Was gelöscht wird</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Konto und Login-Daten</li>
            <li>Profil, Profilbild, Bio und Einstellungen</li>
            <li>Posts, Kommentare, Likes und Follows</li>
            <li>Event-Zusagen (RSVPs), erstellte Events und Roomz</li>
            <li>Nachrichten, Benachrichtigungen und Chat-Anfragen</li>
            <li>Social-Cloud-Punkte, Referral- und Einladungsdaten</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Was aufbewahrt wird</h2>
          <p>
            Aggregierte, nicht personenbezogene Statistiken (z. B. Aufrufzahlen von Events) bleiben
            ohne Personenbezug erhalten. Daten, die wir gesetzlich aufbewahren müssen (z. B.
            Nachweise zu Missbrauchsmeldungen), werden nur für die gesetzliche Dauer gespeichert.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Kein App-Zugang mehr?</h2>
          <p>
            Schreib uns von der registrierten E-Mail-Adresse an{' '}
            <a className="underline" href="mailto:hello@feyrn.de">hello@feyrn.de</a> mit dem Betreff
            „Konto löschen". Wir löschen dein Konto innerhalb von 30 Tagen.
          </p>
        </section>
      </main>
    </div>
  );
}
