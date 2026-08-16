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

export default function AGB() {
  return (
    <LegalPage title="Allgemeine Nutzungsbedingungen">
      <section className="space-y-2">
        <h2 className="font-semibold">1. Geltungsbereich</h2>
        <p>
          Diese Nutzungsbedingungen gelten für die Nutzung der Feyrn-App und aller damit verbundenen
          Dienste, bereitgestellt von [GRÜNDER VOLLSTÄNDIGER NAME], [STRASSE HAUSNUMMER], [PLZ ORT].
          Mit der Registrierung akzeptierst du diese Bedingungen vollständig.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. Leistungsbeschreibung</h2>
        <p>
          Feyrn ist eine soziale Plattform zur Entdeckung von Events und Venues im Nachtleben und
          in der Freizeitgestaltung. Die App ermöglicht das Erstellen und Entdecken von Events,
          das Folgen von Venues, das Teilen von Inhalten sowie soziale Interaktionen zwischen Nutzern.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. Registrierung und Konto</h2>
        <p>
          Die Nutzung von Feyrn setzt eine Registrierung voraus. Du bist verpflichtet, wahrheitsgemäße
          Angaben zu machen und deine Zugangsdaten geheim zu halten. Ein Konto ist nicht übertragbar.
          Wir behalten uns vor, Konten bei Verstößen gegen diese Bedingungen zu sperren oder zu löschen.
        </p>
        <p>
          Mindestalter für die Nutzung: 16 Jahre. Für bestimmte Inhalte (Flirty Cards) ist ein
          Mindestalter von 18 Jahren erforderlich.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">4. Nutzerverhalten und verbotene Inhalte</h2>
        <p>Es ist verboten:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Belästigung, Bedrohung oder Diskriminierung anderer Nutzer</li>
          <li>Verbreitung von Hassinhalten, Gewalt oder illegalen Inhalten</li>
          <li>Sexuelle oder pornografische Inhalte außerhalb der vorgesehenen Funktionen</li>
          <li>Spam, automatisierte Zugriffe oder Scraping</li>
          <li>Verbreitung von Falschinformationen oder irreführenden Inhalten</li>
          <li>Verletzung von Urheberrechten oder anderen Schutzrechten Dritter</li>
          <li>Nutzung der Plattform für kommerzielle Zwecke ohne Genehmigung</li>
          <li>Erstellung von Fake-Profilen oder Identitätsdiebstahl</li>
          <li>Nutzung durch Personen unter 16 Jahren</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">5. Nutzergenerierte Inhalte</h2>
        <p>
          Du bleibst Urheber deiner hochgeladenen Inhalte. Mit dem Hochladen räumst du Feyrn eine
          nicht-exklusive, weltweite, lizenzgebührenfreie Lizenz ein, diese Inhalte im Rahmen des
          Dienstbetriebs zu nutzen, anzuzeigen und zu verbreiten. Diese Lizenz endet mit der
          Löschung deines Kontos oder deiner Inhalte.
        </p>
        <p>
          Du versicherst, dass du die notwendigen Rechte an den von dir hochgeladenen Inhalten besitzt
          und diese keine Rechte Dritter verletzen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">6. Verfügbarkeit und Änderungen</h2>
        <p>
          Wir bemühen uns um eine hohe Verfügbarkeit der App, übernehmen jedoch keine Garantie für
          ununterbrochenen Betrieb. Wir behalten uns vor, Funktionen jederzeit zu ändern, einzuschränken
          oder einzustellen. Wesentliche Änderungen werden rechtzeitig angekündigt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">7. Haftungsbeschränkung</h2>
        <p>
          Feyrn haftet nicht für Inhalte, die von Nutzern erstellt werden. Wir haften nicht für
          Schäden, die durch die Nutzung oder Nichtnutzung der App entstehen, soweit diese nicht
          auf vorsätzlichem oder grob fahrlässigem Verhalten unsererseits beruhen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">8. Kündigung und Kontolöschung</h2>
        <p>
          Du kannst dein Konto jederzeit in den App-Einstellungen unter „Konto löschen" löschen.
          Wir können dein Konto bei schwerwiegenden oder wiederholten Verstößen gegen diese
          Bedingungen ohne Vorankündigung sperren oder löschen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">9. Meldung von Verstößen</h2>
        <p>
          Verstöße gegen diese Bedingungen kannst du direkt in der App über die Melde-Funktion
          oder per E-Mail an [E-MAIL ADRESSE] melden. Wir bearbeiten Meldungen innerhalb von
          72 Stunden.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">10. Apple-spezifische Bedingungen</h2>
        <p>
          Soweit du Feyrn über den Apple App Store beziehst, gilt ergänzend: Apple ist nicht
          Vertragspartner dieser Nutzungsbedingungen. Apple hat keine Pflicht zur Wartung oder
          zum Support der App. Bei Produkthaftungsansprüchen ist ausschließlich Feyrn (nicht Apple)
          verantwortlich. Apple und seine Tochtergesellschaften sind Drittbegünstigte dieser
          Bedingungen und können diese gegenüber dir durchsetzen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">11. Anwendbares Recht</h2>
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist
          [PLZ ORT], soweit du Kaufmann, juristische Person des öffentlichen Rechts oder
          öffentlich-rechtliches Sondervermögen bist.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">12. Änderungen der Nutzungsbedingungen</h2>
        <p>
          Wir behalten uns vor, diese Nutzungsbedingungen anzupassen. Wesentliche Änderungen
          teilen wir dir mindestens 14 Tage vor Inkrafttreten über die App mit. Wenn du der
          Nutzung nach Inkrafttreten der Änderungen weiterhin nicht widersprichst, gelten die
          neuen Bedingungen als akzeptiert.
        </p>
      </section>

      <p className="pt-6 text-xs text-muted-foreground">Stand: [DATUM DER LETZTEN AKTUALISIERUNG]</p>
    </LegalPage>
  );
}
