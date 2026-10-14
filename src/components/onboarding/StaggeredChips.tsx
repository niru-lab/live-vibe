import { useMemo, useState } from 'react';
import { Check, Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

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

/** Wrapping choices keep every option and custom selection fully visible. */
export default function StaggeredChips({
  options,
  selected,
  onToggle,
  allowCustom = false,
  customPlaceholder = 'Eigenes hinzufügen…',
}: Props) {
  const [customs, setCustoms] = useState<Option[]>([]);
  const [input, setInput] = useState('');

  const all = useMemo<Option[]>(() => {
    const entries = [...customs, ...options];
    const restored = selected
      .filter(label => !entries.some(option => option.label === label))
      .map(label => ({ label }));
    return [...restored, ...entries];
  }, [customs, options, selected]);

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
    <div className="dark flex min-w-0 flex-col gap-4 pb-1">
      {allowCustom && (
        <div className="flex min-w-0 items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 40))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            aria-label={customPlaceholder}
            placeholder={customPlaceholder}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-muted/40 px-3 text-sm text-foreground caret-primary outline-none backdrop-blur-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button
            type="button"
            onClick={addCustom}
            disabled={!input.trim()}
            aria-label="Hinzufügen"
            title="Hinzufügen"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg"
          >
            <Plus size={18} weight="bold" />
          </Button>
        </div>
      )}

      <div className="flex min-w-0 flex-wrap gap-2 p-1">
        {all.map(o => {
          const active = selected.includes(o.label);
          return (
            <Button
              key={o.label}
              type="button"
              variant="outline"
              aria-pressed={active}
              onClick={() => onToggle(o.label)}
              className={`h-auto min-h-11 max-w-full gap-1.5 whitespace-normal rounded-full border px-4 py-2.5 text-left text-sm font-medium backdrop-blur-sm transition-colors ${
                active
                  ? 'border-primary bg-primary/20 text-foreground hover:border-primary hover:bg-primary/30 hover:text-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-foreground'
              }`}
            >
              {o.emoji && <span className="shrink-0" aria-hidden="true">{o.emoji}</span>}
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{o.label}</span>
              {active && <Check className="shrink-0" size={14} weight="bold" aria-hidden="true" />}
            </Button>
          );
        })}
      </div>
    </div>
  );
}