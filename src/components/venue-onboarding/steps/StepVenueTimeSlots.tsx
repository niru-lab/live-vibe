const OPTIONS = [
  { value: 'breakfast', emoji: '🌅', label: 'Frühstücks-Crew', hint: '7–11 Uhr' },
  { value: 'day',       emoji: '☀️', label: 'Day-Vibe',         hint: '11–17 Uhr' },
  { value: 'afterwork', emoji: '🌆', label: 'After-Work',       hint: '17–22 Uhr' },
  { value: 'night',     emoji: '🌃', label: 'Nightlife',        hint: '22 Uhr bis spät' },
  { value: 'sunrise',   emoji: '🌙', label: 'Bis Sonnenaufgang', hint: '0–6 Uhr' },
  { value: 'flex',      emoji: '🤷', label: 'Flexibel',          hint: 'je nach Event' },
];

interface Props { value: string[]; onChange: (v: string[]) => void; }

export default function StepVenueTimeSlots({ value, onChange }: Props) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {OPTIONS.map((o) => {
        const sel = value.includes(o.value);
        return (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 14,
              background: sel ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255,255,255,0.04)',
              border: sel ? '1px solid rgba(127, 119, 221, 0.9)' : '0.5px solid rgba(255,255,255,0.1)',
              transition: 'all 180ms',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22 }}>{o.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{o.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{o.hint}</div>
            </div>
            <div
              style={{
                width: 20, height: 20, borderRadius: 6,
                background: sel ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'transparent',
                border: sel ? 'none' : '0.5px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 12, fontWeight: 700,
              }}
            >
              {sel ? '✓' : ''}
            </div>
          </button>
        );
      })}
    </div>
  );
}
