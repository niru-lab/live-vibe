interface Option { value: string; emoji: string; title: string; sub: string; }

const OPTIONS: Option[] = [
  { value: 'club',       emoji: '🕺', title: 'Club / Disco',    sub: 'Bis die Sonne aufgeht' },
  { value: 'bar',        emoji: '🍻', title: 'Bar / Pub',       sub: 'Drinks und gute Sprüche' },
  { value: 'cafe',       emoji: '☕', title: 'Café / Späti',    sub: 'Chill am Tag, Vibe am Abend' },
  { value: 'studio',     emoji: '🎨', title: 'Studio / Atelier', sub: 'Yoga, Tanz, Kunst, you name it' },
  { value: 'sport_crew', emoji: '🏃', title: 'Sport-Crew',      sub: 'Lauftreff, Klettern, Kampfsport' },
  { value: 'event_crew', emoji: '🎪', title: 'Event-Crew',      sub: "Wir hosten wo's grad geil ist" },
  { value: 'other',      emoji: '✨', title: 'Anders',          sub: 'Sonstiges' },
];

interface Props { value: string; onChange: (v: string) => void; }

export default function StepVenueType({ value, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {OPTIONS.map((o) => {
        const sel = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              textAlign: 'left',
              padding: 14,
              borderRadius: 16,
              background: sel ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255,255,255,0.04)',
              border: sel ? '1px solid rgba(127, 119, 221, 0.9)' : '0.5px solid rgba(255,255,255,0.1)',
              transition: 'all 180ms',
              cursor: 'pointer',
              minHeight: 96,
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 6 }}>{o.emoji}</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{o.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.3 }}>{o.sub}</div>
          </button>
        );
      })}
    </div>
  );
}
