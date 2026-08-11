import { Link } from 'react-router-dom';

interface EulaConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

/**
 * Mandatory acknowledgement for user-generated content platforms
 * (Apple Guideline 1.2 / Google Play UGC policy):
 * terms, privacy and a zero-tolerance statement for abusive content.
 */
export const EulaConsent = ({ checked, onChange, id = 'eula-consent' }: EulaConsentProps) => (
  <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
    />
    <span className="text-[11px] leading-relaxed text-muted-foreground">
      Ich akzeptiere die{' '}
      <Link to="/agb" className="underline text-foreground">AGB</Link>,{' '}
      <Link to="/datenschutz" className="underline text-foreground">Datenschutz</Link> und die{' '}
      <Link to="/community" className="underline text-foreground">Community-Regeln</Link>. Mir ist bewusst,
      dass beleidigende, belästigende oder illegale Inhalte nicht toleriert werden und zur Sperrung
      des Kontos führen.
    </span>
  </label>
);
