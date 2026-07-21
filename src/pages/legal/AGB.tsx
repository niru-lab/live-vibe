import { Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';

export default function AGB() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <CaretLeft weight="thin" size={20} /> Zurück
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 space-y-6 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">Allgemeine Nutzungsbedingungen</h1>

        <section className="space-y-2">
          <h2 className="font-semibold">1. Anbieter</h2>
          <p>
            Anbieter der App „Feyrn" ist Niruban Yeyavathanan, Nalla Pillai (Einzelunternehmen),
            Breslauer Str. 70, 73432 Aalen, Deutschland. Kontakt: hello@feyrn.de. Vollständige
            Angaben siehe <Link to="/impressum" className="text-primary underline">Impressum</Link>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">2. Leistungsumfang</h2>
          <p>
            Feyrn ist eine soziale Plattform zum Entdecken, Erstellen und Teilen von Nightlife- und Event-Erlebnissen in
            deutschen Städten. Die Nutzung ist kostenlos. Ein Anspruch auf ununterbrochene Verfügbarkeit besteht nicht.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">3. Registrierung und Mindestalter</h2>
          <p>
            Die Nutzung setzt ein Mindestalter von 16 Jahren voraus. Nutzer versichern bei der Registrierung wahrheitsgemäße Angaben
            zu machen. Ein Konto ist persönlich und darf nicht übertragen werden.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">4. Nutzerinhalte und Verhaltensregeln</h2>
          <p>Untersagt sind insbesondere:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Belästigung, Hassrede, Diskriminierung, Gewaltverherrlichung</li>
            <li>Nacktheit, pornografische oder jugendgefährdende Inhalte</li>
            <li>Werbung ohne Genehmigung, Spam, Fake-Accounts</li>
            <li>Verletzung fremder Rechte (Urheber-, Persönlichkeits-, Markenrechte)</li>
            <li>Weitergabe illegaler Substanzen oder Verabredung zu Straftaten</li>
          </ul>
          <p>
            Verstöße können zur sofortigen Sperrung führen. Nutzer räumen dem Anbieter eine einfache, unentgeltliche Lizenz zur
            Anzeige ihrer Inhalte innerhalb der App ein.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">5. Meldung und Moderation</h2>
          <p>
            Nutzer können unangemessene Inhalte über die Melde-Funktion in der App melden. Der Anbieter behält sich vor,
            gemeldete Inhalte zu prüfen, zu entfernen oder Konten zu sperren.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">6. Kündigung / Account-Löschung</h2>
          <p>
            Nutzer können ihr Konto jederzeit in-app unter Profil → Einstellungen dauerhaft löschen. Der Anbieter kann Konten
            bei schwerwiegenden Verstößen fristlos sperren.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">7. Haftung</h2>
          <p>
            Der Anbieter haftet nach den gesetzlichen Bestimmungen für Vorsatz und grobe Fahrlässigkeit. Für Inhalte anderer
            Nutzer sowie für Events, Orte oder Veranstaltungen wird keine Haftung übernommen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">8. Änderungen</h2>
          <p>
            Der Anbieter kann diese Bedingungen anpassen. Wesentliche Änderungen werden in der App angekündigt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">9. Anwendbares Recht</h2>
          <p>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</p>
        </section>

        <p className="pt-6 text-xs text-muted-foreground">Stand: [Datum]</p>
      </main>
    </div>
  );
}
