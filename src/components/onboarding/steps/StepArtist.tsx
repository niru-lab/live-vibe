import { MagnifyingGlass } from '@phosphor-icons/react';

interface Props {
  artist: string;
  onChange: (v: string) => void;
}

export default function StepArtist({ artist, onChange }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      <MagnifyingGlass
        size={20}
        weight="regular"
        color="rgba(255,255,255,0.4)"
        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}
      />
      <input
        type="text"
        value={artist}
        onChange={e => onChange(e.target.value.slice(0, 60))}
        placeholder="z.B. Bicep, Fred again.., FKA twigs…"
        autoFocus
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          color: '#fff',
          padding: '16px 18px 16px 46px',
          fontSize: 16,
          fontWeight: 500,
          outline: 'none',
          backdropFilter: 'blur(12px)',
        }}
      />
    </div>
  );
}
