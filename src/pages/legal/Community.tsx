import { Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';

export default function Community() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <CaretLeft weight="thin" size={20} /> Zurück
        </Link>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-5 py-8 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">Community-Richtlinien</h1>

        <p>
          Feyrn ist zum Entdecken von Events, Locations und Nightlife da. Damit sich alle sicher
          fühlen, gelten diese Regeln für alle Inhalte – Posts, Kommentare, Events, Profile und
          Nachrichten.
        </p>

        <section className="space-y-2">
          <h2 className="font-semibold">Nicht erlaubt</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Belästigung, Mobbing, Bedrohungen oder Stalking</li>
            <li>Hassrede und Diskriminierung jeder Art</li>
            <li>Sexuelle Inhalte, Nacktheit und jede Form sexueller Ausbeutung</li>
            <li>Inhalte mit oder über Minderjährige in unangemessenem Kontext</li>
            <li>Gewaltdarstellungen, illegale Aktivitäten, Drogenhandel, Waffen</li>
            <li>Spam, Fake-Profile, Identitätsdiebstahl, Betrug</li>
            <li>Veröffentlichen fremder personenbezogener Daten</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Melden und Blockieren</h2>
          <p>
            Jeder Post, Kommentar und jedes Profil kann über das Menü gemeldet werden. Du kannst
            Nutzer jederzeit blockieren – blockierte Nutzer verschwinden aus deinem Feed, aus
            Discover und können dich nicht mehr kontaktieren. Meldungen sind vertraulich: Die
            gemeldete Person erfährt nicht, wer sie gemeldet hat.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Was nach einer Meldung passiert</h2>
          <p>
            Gemeldete Inhalte werden von uns geprüft. Verstöße können zur Entfernung des Inhalts,
            zur Sperrung von Funktionen oder zur dauerhaften Sperrung des Kontos führen. Bei
            Gefahr für Leib und Leben wende dich bitte zusätzlich an die Polizei (110).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Kontakt & Support</h2>
          <p>
            Fragen, Beschwerden oder dringende Fälle:{' '}
            <a className="underline" href="mailto:hello@feyrn.de">hello@feyrn.de</a>
          </p>
        </section>

        <p className="pt-6 text-xs text-muted-foreground">Stand: August 2026</p>
      </main>
    </div>
  );
}
