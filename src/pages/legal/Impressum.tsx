import { Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';

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

        <section className="space-y-2">
          <h2 className="font-semibold">Angaben gemäß § 5 TMG</h2>
          <p>
            Niruban Yeyavathanan<br />
            Nalla Pillai (Einzelunternehmen)<br />
            Breslauer Str 70<br />
            73432 Aalen<br />
            Deutschland
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Kontakt</h2>
          <p>
            E-Mail: hello@feyrn.de
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Verbraucher­streit­beilegung/Universal­schlichtungs­stelle</h2>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <p className="pt-6 text-xs text-muted-foreground">Stand: Juli 2026</p>
      </main>
    </div>
  );
}
