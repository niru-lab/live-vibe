interface Option {
  label: string;
  emoji: string;
}

interface Props {
  options: Option[];
  selected: string[];
  onToggle: (label: string) => void;
  max?: number;
}

export default function VenueOfferingChips({ options, selected, onToggle, max = 8 }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const sel = selected.includes(o.label);
        const disabled = !sel && selected.length >= max;
        return (
          <button
            key={o.label}
            onClick={() => !disabled && onToggle(o.label)}
            disabled={disabled}
            style={{
              padding: '11px 16px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              color: sel ? '#fff' : 'rgba(255,255,255,0.75)',
              background: sel ? 'rgba(124, 58, 237, 0.28)' : 'rgba(255,255,255,0.05)',
              border: sel ? '1px solid rgba(127, 119, 221, 0.9)' : '0.5px solid rgba(255,255,255,0.15)',
              transform: sel ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 180ms',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.3 : 1,
            }}
          >
            <span style={{ marginRight: 6 }}>{o.emoji}</span>
            {o.label}
          </button>
        );
      })}
      <div style={{ width: '100%', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
        {selected.length} / {max} ausgewählt
      </div>
    </div>
  );
}
