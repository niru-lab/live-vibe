const OPTIONS = [
  { value: 'weekend_only', emoji: '🌙', label: 'Nur Wochenende',      sub: 'Fr/Sa/So' },
  { value: 'thu_to_sun',   emoji: '⚡', label: 'Donnerstag bis Sonntag', sub: '' },
  { value: 'weekdays',     emoji: '📅', label: 'Unter der Woche',     sub: 'Mo–Do' },
  { value: 'always',       emoji: '🔥', label: 'Eigentlich immer offen', sub: '' },
  { value: 'event_only',   emoji: '🎪', label: 'Nur wenn Event ist',   sub: '' },
];

interface Props { value: string; onChange: (v: string) => void; }

export default function StepVenueDayPattern({ value, onChange }: Props) {
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
            <span style={{ fontSize: 22 }}>{o.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{o.label}</div>
              {o.sub && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{o.sub}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
