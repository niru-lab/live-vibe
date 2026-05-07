import { useMemo } from 'react';

interface Props {
  birthdate: string; // YYYY-MM-DD
  onChange: (v: string) => void;
}

function calcAge(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function StepAge({ birthdate, onChange }: Props) {
  const age = useMemo(() => calcAge(birthdate), [birthdate]);
  const max = new Date().toISOString().slice(0, 10);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    color: '#fff',
    padding: '16px 18px',
    fontSize: 17,
    fontWeight: 500,
    outline: 'none',
    fontFamily: 'inherit',
    backdropFilter: 'blur(12px)',
  };

  return (
    <div className="space-y-3">
      <input
        type="date"
        value={birthdate}
        max={max}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        autoFocus
      />
      {age !== null && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Du bist {age} Jahre alt.
        </p>
      )}
    </div>
  );
}

export function isAgeValid(birthdate: string) {
  const a = calcAge(birthdate);
  return a !== null && a >= 0;
}
