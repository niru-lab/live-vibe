const OPTIONS = [
  { value: 'student',  emoji: '💸',      label: 'Student-friendly', sub: "Geht für 'nen Zehner durch" },
  { value: 'mid',      emoji: '💸💸',    label: 'Mittelklasse',     sub: '15–30 € sind realistisch' },
  { value: 'premium',  emoji: '💸💸💸',  label: 'Premium',          sub: 'Wir spielen in der Liga' },
  { value: 'free',     emoji: '🎁',      label: 'Free / Spenden',   sub: 'Eintritt für umme' },
];

interface Props { value: string; onChange: (v: string) => void; }

export default function StepVenuePriceTier({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {OPTIONS.map((o) => {
        const sel = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              background: sel ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255,255,255,0.04)',
              border: sel ? '1px solid rgba(127, 119, 221, 0.9)' : '0.5px solid rgba(255,255,255,0.1)',
              transition: 'all 180ms', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 18, minWidth: 60 }}>{o.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{o.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{o.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
