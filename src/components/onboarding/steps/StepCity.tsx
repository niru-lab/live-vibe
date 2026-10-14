import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import StaggeredChips from '../StaggeredChips';

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
    const base = [...(cities ?? FALLBACK_CITIES), 'Ulm', 'Andere'];
    // keep any already-selected city visible even if it isn't in the source list
    return Array.from(new Set([...base, ...selected]));
  }, [cities, selected]);

  const toggle = (city: string) =>
    onChange(selected.includes(city) ? selected.filter((c) => c !== city) : [...selected, city]);

  return (
    <StaggeredChips
      options={options.map(label => ({ label, emoji: '📍' }))}
      selected={selected}
      onToggle={toggle}
      multi
    />
  );
}
