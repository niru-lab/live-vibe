export interface VibeValue {
  crowd: number | null;
  mood: number | null;
  musicFit: boolean | null;
}

const Scale = ({ label, value, onChange, emojis }: { label: string; value: number | null; onChange: (v: number | null) => void; emojis: string[] }) => (
  <div className="space-y-1.5">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="flex gap-1.5">
      {emojis.map((e, i) => {
        const v = i + 1;
        const sel = value === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={sel}
            aria-label={`${label} ${v} von 5`}
            onClick={() => onChange(sel ? null : v)}
            className={`flex h-10 flex-1 items-center justify-center rounded-xl border text-lg transition ${sel ? 'scale-105 border-primary bg-primary/20' : 'border-border/50 bg-card/60 hover:border-primary/50'}`}
          >
            {e}
          </button>
        );
      })}
    </div>
  </div>
);

/** Optional but prominent vibe rating for posts. */
export const VibeCheck = ({ value, onChange }: { value: VibeValue; onChange: (v: VibeValue) => void }) => (
  <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
    <div>
      <p className="text-sm font-semibold text-foreground">Vibe-Check ✨</p>
      <p className="text-[11px] text-muted-foreground">Optional, hilft anderen aber mega.</p>
    </div>
    <Scale label="Wie voll ist es?" emojis={['🫥', '🙂', '😊', '🔥', '🤯']} value={value.crowd} onChange={(crowd) => onChange({ ...value, crowd })} />
    <Scale label="Wie ist die Stimmung?" emojis={['😴', '😐', '🙂', '😄', '🥳']} value={value.mood} onChange={(mood) => onChange({ ...value, mood })} />
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">Passt die Musik?</p>
      <div className="flex gap-1.5">
        {[{ v: true, l: '🎶 Ja' }, { v: false, l: '🙉 Nö' }].map((o) => {
          const sel = value.musicFit === o.v;
          return (
            <button
              key={o.l}
              type="button"
              aria-pressed={sel}
              onClick={() => onChange({ ...value, musicFit: sel ? null : o.v })}
              className={`h-10 flex-1 rounded-xl border text-sm transition ${sel ? 'border-primary bg-primary/20 text-foreground' : 'border-border/50 bg-card/60 text-muted-foreground hover:border-primary/50'}`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
