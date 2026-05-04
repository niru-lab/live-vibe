const OPTIONS = [
  { emoji: '🍸', label: 'Pre-Game & dann schauen was kommt' },
  { emoji: '🎉', label: 'Club bis der Beat aufhört' },
  { emoji: '🍕', label: 'Dinner mit Freunden, früh heim' },
  { emoji: '🎶', label: 'Konzert oder Live-Event' },
  { emoji: '🛋️', label: 'Netflix & ehrlich gesagt lieber zuhause' },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function StepWeekend({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      {OPTIONS.map(o => {
        const sel = value === o.label;
        return (
          <button
            key={o.label}
            onClick={() => onChange(o.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 18px',
              borderRadius: 16,
              background: sel ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderLeft: sel ? '4px solid transparent' : '0.5px solid rgba(255,255,255,0.1)',
              borderImage: sel ? 'linear-gradient(180deg, #7C3AED, #EC4899) 1' : undefined,
              borderImageSlice: sel ? 1 : undefined,
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 180ms ease-out',
            }}
          >
            <span style={{ fontSize: 22 }}>{o.emoji}</span>
            <span style={{
              color: sel ? '#fff' : 'rgba(255,255,255,0.75)',
              fontSize: 15, fontWeight: 500,
            }}>
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
