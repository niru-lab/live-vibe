import StaggeredChips from '../StaggeredChips';

interface Props {
  options: string[];
  selected: string[];
  multi?: boolean;
  onChange: (v: string[]) => void;
}

/** Generic chip picker for single- or multi-select onboarding steps. */
export default function StepChoice({ options, selected, multi = false, onChange }: Props) {
  const toggle = (o: string) => {
    if (!multi) return onChange([o]);
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  };
  return (
    <StaggeredChips
      options={options.map(label => ({ label }))}
      selected={selected}
      onToggle={toggle}
      multi={multi}
    />
  );
}

interface ConsentProps {
  age: number | null;
  analytics: boolean;
  marketing: boolean;
  onChange: (v: { analytics: boolean; marketing: boolean }) => void;
}

export function StepConsents({ age, analytics, marketing, onChange }: ConsentProps) {
  const locked = age !== null && age < 16;
  const Row = ({ label, sub, value, k }: { label: string; sub: string; value: boolean; k: 'analytics' | 'marketing' }) => (
    <label style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 4px', opacity: locked ? 0.45 : 1, cursor: locked ? 'not-allowed' : 'pointer' }}>
      <input
        type="checkbox"
        disabled={locked}
        checked={!locked && value}
        onChange={(e) => onChange({ analytics, marketing, [k]: e.target.checked })}
        style={{ width: 20, height: 20, marginTop: 2, accentColor: '#7C3AED' }}
      />
      <span>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, display: 'block' }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{sub}</span>
      </span>
    </label>
  );
  return (
    <div>
      <Row k="analytics" value={analytics} label="Nutzungsanalyse" sub="Hilf uns, Feyrn besser zu machen – anonymisiert." />
      <Row k="marketing" value={marketing} label="News & Angebote" sub="Ab und zu Tipps zu Events und Aktionen." />
      {locked && (
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>Ab 16 kannst du hier selbst zustimmen.</p>
      )}
    </div>
  );
}
