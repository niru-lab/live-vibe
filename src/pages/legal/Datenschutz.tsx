import { Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur">
        <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <CaretLeft weight="thin" size={20} /> Zurück
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 space-y-8 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">Datenschutz&shy;erklärung</h1>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">1. Datenschutz auf einen Blick</h2>

          <div className="space-y-2">
            <h3 className="font-semibold">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit deinen personenbezogenen Daten passiert, wenn du Feyrn nutzt. Personenbezogene Daten sind alle Daten, mit denen du persönlich identifiziert werden kannst. Ausführliche Informationen zum Thema Datenschutz entnimmst du dieser Datenschutzerklärung.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Datenerfassung in der Feyrn-App</h3>
            <h4 className="font-medium">Wer ist verantwortlich für die Datenerfassung?</h4>
            <p>
              Die Datenverarbeitung in Feyrn erfolgt durch den unten genannten Betreiber. Die Kontaktdaten findest du im Abschnitt „Hinweis zur verantwortlichen Stelle“.
            </p>
            <h4 className="font-medium">Wie erfassen wir deine Daten?</h4>
            <p>
              Deine Daten werden zum einen dadurch erhoben, dass du uns diese mitteilst – z. B. bei der Registrierung, Profilgestaltung, Erstellung von Posts, Events oder Roomz.
            </p>
            <p>
              Andere Daten werden automatisch oder nach deiner Einwilligung beim Nutzen der App durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Gerätetyp, Betriebssystem, App-Version, Uhrzeit des Aufrufs) sowie Standortdaten und Push-Token, sofern du diese freigibst.
            </p>
            <h4 className="font-medium">Wofür nutzen wir deine Daten?</h4>
            <p>
              Ein Teil der Daten wird erhoben, um Feyrn technisch fehlerfrei bereitzustellen und dir nahegelegene Events, Locations und Personen anzuzeigen. Andere Daten können zur Analyse des Nutzerverhaltens oder zur Verbesserung der App verwendet werden. Vertragsrelevante Daten (z. B. bei Event-Anfragen) werden für die Kommunikation zwischen Host und Gast verarbeitet.
            </p>
            <h4 className="font-medium">Welche Rechte hast du bezüglich deiner Daten?</h4>
            <p>
              Du hast jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck deiner gespeicherten personenbezogenen Daten zu erhalten. Außerdem hast du ein Recht auf Berichtigung oder Löschung dieser Daten. Wenn du eine Einwilligung zur Datenverarbeitung erteilt hast, kannst du diese jederzeit für die Zukunft widerrufen. Unter bestimmten Umständen kannst du die Einschränkung der Verarbeitung verlangen. Des Weiteren steht dir ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
            </p>
            <p>
              Hierzu sowie zu weiteren Fragen zum Thema Datenschutz kannst du dich jederzeit an uns wenden.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Hosting und Infrastruktur</h2>
          <p>Wir hosten Feyrn und die zugehörigen Daten bei folgenden Anbietern:</p>

          <div className="space-y-2">
            <h3 className="font-semibold">Lovable Cloud</h3>
            <p>
              Anbieter ist Lovable Cloud (Hosting, Backend, Datenbank, Authentifizierung, Storage und Edge Functions). Die Daten werden in von Lovable verwalteter Infrastruktur verarbeitet und gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer zuverlässigen Bereitstellung der App). Sofern eine Einwilligung abgefragt wurde, erfolgt die Verarbeitung zusätzlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Mapbox</h3>
            <p>
              Anbieter ist Mapbox Inc., 740 15th Street NW, Washington, DC 20005, USA. Mapbox wird für die Kartendarstellung und die Anzeige von Events und Locations genutzt. Bei der Nutzung der Karte können technische Daten (z. B. IP-Adresse, Browser-Informationen) an Mapbox übermittelt werden. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Weitere Informationen findest du in der Datenschutzerklärung von Mapbox.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Apple / Google Push Services</h3>
            <p>
              Für Push-Benachrichtigungen (z. B. neue Follower, Event-Einladungen, Nachrichten) werden Push-Token an Apple Push Notification Service (APNs) bzw. Firebase Cloud Messaging (Google) übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO (deine Einwilligung beim ersten App-Start). Du kannst Push-Benachrichtigungen jederzeit in den Systemeinstellungen deines Geräts deaktivieren.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Allgemeine Hinweise und Pflichtinformationen</h2>

          <div className="space-y-2">
            <h3 className="font-semibold">Datenschutz</h3>
            <p>
              Die Betreiber von Feyrn nehmen den Schutz deiner persönlichen Daten sehr ernst. Wir behandeln deine personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>
            <p>
              Wenn du Feyrn nutzt, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen du persönlich identifiziert werden kannst. Diese Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen.
            </p>
            <p>
              Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Hinweis zur verantwortlichen Stelle</h3>
            <p>Die verantwortliche Stelle für die Datenverarbeitung in Feyrn ist:</p>
            <p>
              Niruban Yeyavathanan<br />
              Nalla Pillai (Einzelunternehmen)<br />
              Breslauer Str. 70<br />
              73432 Aalen<br />
              Deutschland
            </p>
            <p>
              Telefon: [Telefonnummer]<br />
              E-Mail: hello@feyrn.de
            </p>
            <p>
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Speicherdauer</h3>
            <p>
              Soweit in dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben deine personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn du ein berechtigtes Löschersuchen geltend machst oder eine Einwilligung widerrufst, werden deine Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen). Zeitlich begrenzte Inhalte (z. B. Moment-X-Posts) werden automatisch nach 24 Stunden gelöscht.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Rechtsgrundlagen der Datenverarbeitung</h3>
            <p>
              Sofern du in die Datenverarbeitung eingewilligt hast, verarbeiten wir deine Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO. Bei Standort- oder Push-Benachrichtigungen erfolgt die Verarbeitung auf Grundlage deiner Einwilligung (Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG). Die Einwilligung ist jederzeit widerrufbar.
            </p>
            <p>
              Für die Bereitstellung der App-Funktionen (z. B. Account, Posts, Events, Nachrichten) verwenden wir Art. 6 Abs. 1 lit. b DSGVO. Rechtliche Verpflichtungen werden nach Art. 6 Abs. 1 lit. c DSGVO verarbeitet. Weitere Verarbeitungen können auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen (z. B. Betriebssicherheit, Missbrauchsprävention).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Empfänger von personenbezogenen Daten</h3>
            <p>
              Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit externen Dienstleistern zusammen (z. B. Hosting, Kartendarstellung, Push-Benachrichtigungen). Dabei kann eine Übermittlung von personenbezogenen Daten an diese Stellen erforderlich sein. Wir geben personenbezogene Daten nur weiter, wenn dies zur Vertragserfüllung erforderlich ist, wir gesetzlich hierzu verpflichtet sind, ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO besteht oder eine andere Rechtsgrundlage die Weitergabe erlaubt. Bei Auftragsverarbeitern wird ein Vertrag über Auftragsverarbeitung geschlossen.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Widerruf deiner Einwilligung zur Datenverarbeitung</h3>
            <p>
              Viele Datenverarbeitungsvorgänge sind nur mit deiner ausdrücklichen Einwilligung möglich. Du kannst eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3>
            <p>
              Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, hast du jederzeit das Recht, aus Gründen, die sich aus deiner besonderen Situation ergeben, gegen die Verarbeitung deiner personenbezogenen Daten Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling. Die jeweilige Rechtsgrundlage entnimmst du dieser Datenschutzerklärung. Wenn du Widerspruch einlegst, werden wir deine betroffenen personenbezogenen Daten nicht mehr verarbeiten, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die deine Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen (Widerspruch nach Art. 21 Abs. 1 DSGVO).
            </p>
            <p>
              Werden deine personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, so hast du das Recht, jederzeit Widerspruch gegen die Verarbeitung zu einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Wenn du widersprichst, werden deine personenbezogenen Daten anschließend nicht mehr zum Zwecke der Direktwerbung verwendet (Widerspruch nach Art. 21 Abs. 2 DSGVO).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
            <p>
              Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Recht auf Datenübertragbarkeit</h3>
            <p>
              Du hast das Recht, Daten, die wir auf Grundlage deiner Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern du die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangst, erfolgt dies nur, soweit es technisch machbar ist.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Auskunft, Berichtigung und Löschung</h3>
            <p>
              Du hast im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über deine gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten kannst du dich jederzeit an uns wenden.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Recht auf Einschränkung der Verarbeitung</h3>
            <p>
              Du hast das Recht, die Einschränkung der Verarbeitung deiner personenbezogenen Daten zu verlangen. Hierzu kannst du dich jederzeit an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Wenn du die Richtigkeit deiner bei uns gespeicherten personenbezogenen Daten bestreitest, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung hast du das Recht, die Einschränkung der Verarbeitung zu verlangen.</li>
              <li>Wenn die Verarbeitung deiner personenbezogenen Daten unrechtmäßig geschah/geschieht, kannst du statt der Löschung die Einschränkung der Datenverarbeitung verlangen.</li>
              <li>Wenn wir deine personenbezogenen Daten nicht mehr benötigen, du sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigst, hast du das Recht, statt der Löschung die Einschränkung der Verarbeitung zu verlangen.</li>
              <li>Wenn du einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt hast, muss eine Abwägung zwischen deinen und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, hast du das Recht, die Einschränkung der Verarbeitung zu verlangen.</li>
            </ul>
            <p>
              Wenn du die Verarbeitung deiner personenbezogenen Daten eingeschränkt hast, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit deiner Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">4. Datenerfassung in Feyrn</h2>

          <div className="space-y-2">
            <h3 className="font-semibold">Erhobene Daten</h3>
            <p>Bei der Nutzung von Feyrn verarbeiten wir folgende personenbezogene Daten:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registrierung: E-Mail-Adresse, Passwort (gehasht), Username, Anzeigename, Alter, Stadt, Rolle (User / Venue-Betreiber)</li>
              <li>Profildaten: Musikgenres, Lieblingsartist, Getränk, Wochenendtyp, Profilbild, Biografie, soziale Handles, Privatsphäre-Einstellungen</li>
              <li>Nutzungsdaten: Erstellte Posts, Events, Roomz, Kommentare, Likes, Follows, geteilte Standorte, Chat- und Event-Nachrichten</li>
              <li>Standortdaten (nur nach Freigabe): grobe Position zur Anzeige nahegelegener Events und zur Stadt-Auswahl</li>
              <li>Kommunikation: Direktnachrichten, Event-Chats, Push-Token für Benachrichtigungen</li>
              <li>Technische Daten: IP-Adresse, Gerätetyp, Betriebssystem, App-Version, Browser-Informationen</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Cookies und lokale Speicherung</h3>
            <p>
              Feyrn ist primär eine native App (iOS/Android). Im Web-View bzw. Browser können technisch notwendige Cookies oder lokale Speicherung (z. B. für die Anmeldung, Spracheinstellungen oder Sicherheit) verwendet werden. Diese sind für den Betrieb der App erforderlich und werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert. Sofern eine Einwilligung für zusätzliche Cookies oder Tracking abgefragt wird, erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG; die Einwilligung ist jederzeit widerrufbar.
            </p>
            <p>
              Du kannst dein Gerät bzw. deinen Browser so einstellen, dass du über das Setzen von Cookies informiert wirst und Cookies nur im Einzelfall erlaubst. Bei der Deaktivierung von Cookies kann die Funktionalität der App eingeschränkt sein.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Push-Benachrichtigungen und Standort</h3>
            <p>
              Push-Benachrichtigungen (z. B. für neue Follower, Event-Einladungen, Zusagen, Nachrichten, Roomz-Aktivität) und Standortzugriff werden nur nach ausdrücklicher Zustimmung im Betriebssystem verwendet und können jederzeit in den Systemeinstellungen widerrufen werden. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Einsatz von KI</h3>
            <p>
              Feyrn selbst setzt keine KI-gestützten Chatbots oder Inhaltsgeneratoren ein, die deine Eingaben verarbeiten. Die App wurde mit der Lovable-Entwicklungsplattform erstellt, die interne KI-Werkzeuge für die Software-Entwicklung nutzt. Diese verarbeiten keine personenbezogenen Nutzerdaten im Live-Betrieb von Feyrn.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Account-Löschung</h3>
            <p>
              Du kannst deinen Account jederzeit in der App unter Profil → Einstellungen → Profil löschen löschen. Mit der Löschung werden dein Profil, deine Posts, Events und Roomz sowie zugehörige Daten entfernt, sofern keine gesetzlichen Aufbewahrungsfristen entgegenstehen. Chat-Nachrichten, die du anderen Nutzern gesendet hast, können bei diesen verbleiben, werden aber deinem gelöschten Account nicht mehr zugeordnet.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">5. Sicherheit und Moderation</h2>
          <p>
            Feyrn bietet Funktionen zum Melden und Blockieren von Inhalten und Nutzern. Wenn du einen Nutzer oder Inhalt meldest, werden die gemeldeten Daten sowie der Meldegrund zur Prüfung gespeichert (Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO). Blockierte Nutzer können deine Inhalte nicht mehr sehen und dir keine Nachrichten senden.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">6. Änderungen dieser Datenschutzerklärung</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder neue Funktionen der App anzupassen. Die aktuelle Version ist immer in der App unter dem Link „Datenschutz“ verfügbar.
          </p>
        </section>

        <p className="pt-4 text-xs text-muted-foreground">Stand: Juli 2026</p>
      </main>
    </div>
  );
}
