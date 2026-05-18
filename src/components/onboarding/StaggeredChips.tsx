import { useMemo } from 'react';

interface Option {
  label: string;
  emoji?: string;
}

interface Props {
  options: Option[];
  selected: string[];
  onToggle: (label: string) => void;
  multi?: boolean;
}

/**
 * Two-row staggered "brick" chip layout.
 * Row 1 sits flush, Row 2 is shifted horizontally so chips interlock visually.
 * Chips overflow the container edges on purpose (matches mockup).
 */
export default function StaggeredChips({ options, selected, onToggle }: Props) {
  const [rowA, rowB] = useMemo(() => {
    const a: Option[] = [];
    const b: Option[] = [];
    options.forEach((o, i) => (i % 2 === 0 ? a.push(o) : b.push(o)));
    return [a, b];
  }, [options]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginLeft: -18,
        marginRight: -18,
      }}
    >
      <Row items={rowA} selected={selected} onToggle={onToggle} offset={0} />
      <Row items={rowB} selected={selected} onToggle={onToggle} offset={28} />
    </div>
  );
}

function Row({
  items, selected, onToggle, offset,
}: { items: Option[]; selected: string[]; onToggle: (l: string) => void; offset: number }) {
  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 8,
        paddingLeft: 18 + offset,
        paddingRight: 18,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {items.map((o) => {
        const sel = selected.includes(o.label);
        return (
          <button
            key={o.label}
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
              transition: 'all 180ms ease-out',
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
  );
}
