const DRINKS = [
  { emoji: '🍺', label: 'Bier' },
  { emoji: '🍹', label: 'Cocktails' },
  { emoji: '🥃', label: 'Shots' },
  { emoji: '🍾', label: 'Prosecco / Sekt' },
  { emoji: '🧃', label: 'Alkoholfrei' },
  { emoji: '🤷', label: 'Kommt drauf an' },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function StepDrink({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {DRINKS.map(d => {
        const sel = value === d.label;
        return (
          <button
            key={d.label}
            onClick={() => onChange(d.label)}
            style={{
              padding: '12px 18px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              color: sel ? '#fff' : 'rgba(255,255,255,0.75)',
              background: sel ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.05)',
              border: sel ? '1px solid transparent' : '0.5px solid rgba(255,255,255,0.15)',
              backgroundImage: sel
                ? 'linear-gradient(rgba(124,58,237,0.25), rgba(124,58,237,0.25)), linear-gradient(90deg, #7C3AED, #EC4899)'
                : undefined,
              backgroundOrigin: 'border-box',
              backgroundClip: sel ? 'padding-box, border-box' : undefined,
              transform: sel ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 180ms ease-out',
              cursor: 'pointer',
            }}
          >
            <span style={{ marginRight: 6 }}>{d.emoji}</span>{d.label}
          </button>
        );
      })}
    </div>
  );
}
