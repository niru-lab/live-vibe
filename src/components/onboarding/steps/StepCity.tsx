import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const FALLBACK_CITIES = ['Stuttgart', 'Aalen', 'Esslingen', 'Ludwigsburg', 'Heilbronn', 'Tübingen', 'Ulm', 'Frankfurt'];

interface Props {
  selected: string[];
  onChange: (v: string[]) => void;
}

export default function StepCity({ selected, onChange }: Props) {
  const [cities, setCities] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('cities')
      .select('name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (cancelled) return;
        const names = (data ?? []).map((c) => c.name).filter(Boolean);
        setCities(names.length ? names : FALLBACK_CITIES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    const base = cities ?? FALLBACK_CITIES;
    // keep any already-selected city visible even if it isn't in the source list
    return Array.from(new Set([...base, ...selected]));
  }, [cities, selected]);

  const toggle = (city: string) =>
    onChange(selected.includes(city) ? selected.filter((c) => c !== city) : [...selected, city]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((city) => {
        const sel = selected.includes(city);
        return (
          <button
            key={city}
            onClick={() => toggle(city)}
            style={{
              padding: '11px 18px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              color: sel ? '#fff' : 'rgba(255,255,255,0.75)',
              background: sel ? 'rgba(124, 58, 237, 0.28)' : 'rgba(255,255,255,0.05)',
              border: sel ? '1px solid rgba(127, 119, 221, 0.9)' : '0.5px solid rgba(255,255,255,0.15)',
              transform: sel ? 'scale(1.04)' : 'scale(1)',
              transition: 'background 180ms, color 180ms, border 180ms, transform 180ms',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            📍 {city}
          </button>
        );
      })}
    </div>
  );
}
