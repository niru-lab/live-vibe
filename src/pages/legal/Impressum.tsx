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

export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <section className="space-y-2">
        <h2 className="font-semibold">Angaben gemäß § 5 TMG</h2>
        <p>
          [GRÜNDER VOLLSTÄNDIGER NAME]<br />
          [STRASSE HAUSNUMMER]<br />
          [PLZ ORT]<br />
          Deutschland
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Kontakt</h2>
        <p>
          E-Mail: [E-MAIL ADRESSE]<br />
          Telefon: [TELEFONNUMMER OPTIONAL]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          [GRÜNDER VOLLSTÄNDIGER NAME]<br />
          [STRASSE HAUSNUMMER]<br />
          [PLZ ORT]
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          https://ec.europa.eu/consumers/odr/. Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
          nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
          Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Urheberrecht</h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
          der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
          Zustimmung des jeweiligen Autors bzw. Erstellers.
        </p>
      </section>

      <p className="pt-6 text-xs text-muted-foreground">Stand: [DATUM DER LETZTEN AKTUALISIERUNG]</p>
    </LegalPage>
  );
}
