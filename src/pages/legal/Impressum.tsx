import { Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';

// TODO: Firmierung noch unklar – vor App-Store-Release final ausfüllen.
// Pflicht nach § 5 TMG (DE).
export default function Impressum() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <CaretLeft weight="thin" size={20} /> Zurück
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 space-y-6 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">Impressum</h1>

        <section className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Platzhalter – Firmierung noch nicht final. Vor Veröffentlichung im App Store durch echte Angaben ersetzen.
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Angaben gemäß § 5 TMG</h2>
          <p>
            [Firmenname / Inhaber]<br />
            [Straße Hausnummer]<br />
            [PLZ Ort]<br />
            Deutschland
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Vertreten durch</h2>
          <p>[Geschäftsführer / Inhaber]</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Kontakt</h2>
          <p>
            E-Mail: [kontakt@feyrn.de]<br />
            Telefon: [optional]
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Registereintrag</h2>
          <p>
            [Handelsregister / Amtsgericht / HRB-Nummer]<br />
            [oder: Einzelunternehmen, nicht im HR eingetragen]
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Umsatzsteuer-ID</h2>
          <p>[USt-IdNr. gemäß § 27 a UStG] oder [Kleinunternehmer nach § 19 UStG]</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>
            [Name]<br />
            [Anschrift wie oben]
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" className="text-primary underline" target="_blank" rel="noreferrer">
              https://ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <p className="pt-6 text-xs text-muted-foreground">Stand: [Datum]</p>
      </main>
    </div>
  );
}
