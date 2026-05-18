import { useMemo, useState } from 'react';
import { Plus } from '@phosphor-icons/react';

interface Option {
  label: string;
  emoji?: string;
}

interface Props {
  options: Option[];
  selected: string[];
  onToggle: (label: string) => void;
  multi?: boolean;
  /** Allow user to add their own entries. Added entries appear as selected chips. */
  allowCustom?: boolean;
  customPlaceholder?: string;
}

/**
 * Two-row marquee chip layout.
 * Row 1 scrolls left → right, Row 2 scrolls right → left.
 * Pauses on hover/touch. Optional custom input below.
 */
export default function StaggeredChips({
  options,
  selected,
  onToggle,
  allowCustom = false,
  customPlaceholder = 'Eigenes hinzufügen…',
}: Props) {
  const [customs, setCustoms] = useState<Option[]>([]);
  const [input, setInput] = useState('');

  const all = useMemo(() => [...customs, ...options], [customs, options]);

  const [rowA, rowB] = useMemo(() => {
    const a: Option[] = [];
    const b: Option[] = [];
    all.forEach((o, i) => (i % 2 === 0 ? a.push(o) : b.push(o)));
    return [a, b];
  }, [all]);

  const addCustom = () => {
    const v = input.trim();
    if (!v) return;
    if (!all.some(o => o.label.toLowerCase() === v.toLowerCase())) {
      setCustoms(c => [{ label: v }, ...c]);
    }
    if (!selected.includes(v)) onToggle(v);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginLeft: -18,
          marginRight: -18,
          overflow: 'hidden',
          maskImage:
            'linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
        }}
      >
        <MarqueeRow items={rowA} selected={selected} onToggle={onToggle} direction="left" speed={42} />
        <MarqueeRow items={rowB} selected={selected} onToggle={onToggle} direction="right" speed={52} />
      </div>

      {allowCustom && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 40))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder={customPlaceholder}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              color: '#fff',
              padding: '12px 14px',
              fontSize: 14,
              outline: 'none',
              backdropFilter: 'blur(8px)',
            }}
          />
          <button
            onClick={addCustom}
            disabled={!input.trim()}
            aria-label="Hinzufügen"
            style={{
              width: 44,
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(90deg, #7C3AED 0%, #EC4899 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              opacity: input.trim() ? 1 : 0.4,
              transition: 'opacity 180ms',
            }}
          >
            <Plus size={18} weight="bold" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes feyrnMarqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes feyrnMarqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .feyrn-marquee-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

function MarqueeRow({
  items, selected, onToggle, direction, speed,
}: {
  items: Option[];
  selected: string[];
  onToggle: (l: string) => void;
  direction: 'left' | 'right';
  speed: number; // seconds per loop
}) {
  // Duplicate items so the loop is seamless.
  const loop = [...items, ...items];

  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <div
        className="feyrn-marquee-track"
        style={{
          display: 'inline-flex',
          gap: 8,
          paddingLeft: 8,
          paddingRight: 8,
          whiteSpace: 'nowrap',
          animation: `${direction === 'left' ? 'feyrnMarqueeLeft' : 'feyrnMarqueeRight'} ${speed}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {loop.map((o, idx) => {
          const sel = selected.includes(o.label);
          return (
            <button
              key={`${o.label}-${idx}`}
              onClick={() => onToggle(o.label)}
              style={{
                flex: '0 0 auto',
                padding: '11px 18px',
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                color: sel ? '#fff' : 'rgba(255,255,255,0.75)',
                background: sel
                  ? 'rgba(124, 58, 237, 0.28)'
                  : 'rgba(255,255,255,0.05)',
                border: sel
                  ? '1px solid rgba(127, 119, 221, 0.9)'
                  : '0.5px solid rgba(255,255,255,0.15)',
                transform: sel ? 'scale(1.04)' : 'scale(1)',
                transition: 'background 180ms, color 180ms, border 180ms, transform 180ms',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              {o.emoji ? <span style={{ marginRight: 6 }}>{o.emoji}</span> : null}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
