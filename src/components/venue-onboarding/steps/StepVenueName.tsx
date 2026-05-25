import { useEffect, useState } from 'react';

const PLACEHOLDERS = [
  'z.B. Tigerpalast Aalen',
  'z.B. Hans Bar',
  'z.B. Yoga Sonne',
  'z.B. Runners Club Ostalb',
];

interface Props { value: string; onChange: (v: string) => void; }

export default function StepVenueName({ value, onChange }: Props) {
  const [phIdx, setPhIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 60))}
        placeholder={PLACEHOLDERS[phIdx]}
        autoFocus
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          color: '#fff',
          padding: '16px 16px',
          fontSize: 16,
          outline: 'none',
          transition: 'border 200ms',
        }}
      />
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'right' }}>
        {value.length} / 60
      </div>
    </div>
  );
}
