const GENRES = ['Hip-Hop','House','Techno','R&B','Pop','Afrobeats','Drum & Bass','Reggaeton','Indie','Latin'];

interface Props {
  selected: string[];
  onChange: (v: string[]) => void;
}

export default function StepGenres({ selected, onChange }: Props) {
  const toggle = (g: string) => {
    onChange(selected.includes(g) ? selected.filter(x => x !== g) : [...selected, g]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {GENRES.map(g => {
        const sel = selected.includes(g);
        return (
          <button
            key={g}
            onClick={() => toggle(g)}
            style={{
              padding: '10px 16px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              color: sel ? '#fff' : 'rgba(255,255,255,0.7)',
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
            {sel ? '✓ ' : ''}{g}
          </button>
        );
      })}
    </div>
  );
}
