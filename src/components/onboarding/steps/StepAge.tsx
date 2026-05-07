interface Props {
  birthdate: string; // we store age as string here for compatibility (e.g. "24")
  onChange: (v: string) => void;
}

export default function StepAge({ birthdate, onChange }: Props) {
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
    textAlign: 'center',
    letterSpacing: '0.02em',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    onChange(v);
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={birthdate}
        onChange={handleChange}
        placeholder="Dein Alter"
        style={inputStyle}
        autoFocus
      />
    </div>
  );
}

export function isAgeValid(birthdate: string) {
  const n = parseInt(birthdate, 10);
  return !isNaN(n) && n >= 1 && n <= 99;
}
