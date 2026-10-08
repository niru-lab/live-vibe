import { useRef } from 'react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '0.5px solid rgba(255,255,255,0.12)',
  borderRadius: 14,
  color: '#fff',
  padding: '14px 16px',
  fontSize: 15,
  outline: 'none',
  backdropFilter: 'blur(12px)',
};
const labelStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6, display: 'block' };

export interface ProofData {
  contactName: string;
  imprintUrl: string;
  registerNumber: string;
  capacity: string;
}

export const isProofValid = (p: ProofData) =>
  p.contactName.trim().length >= 2 &&
  (/^https?:\/\/\S+\.\S+/.test(p.imprintUrl.trim()) || /^HR[AB]\s?\d{2,7}/i.test(p.registerNumber.trim())) &&
  (p.capacity === '' || (/^\d+$/.test(p.capacity) && Number(p.capacity) <= 100000));

export function StepVenueProof({ value, onChange }: { value: ProofData; onChange: (v: ProofData) => void }) {
  const set = (k: keyof ProofData) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div><label style={labelStyle}>Ansprechpartner*in</label><input style={inputStyle} value={value.contactName} onChange={set('contactName')} placeholder="Vor- und Nachname" maxLength={80} /></div>
      <div><label style={labelStyle}>Impressum-Link</label><input style={inputStyle} value={value.imprintUrl} onChange={set('imprintUrl')} placeholder="https://deinspot.de/impressum" inputMode="url" maxLength={300} /></div>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' }}>— oder —</p>
      <div><label style={labelStyle}>Handelsregisternummer</label><input style={inputStyle} value={value.registerNumber} onChange={set('registerNumber')} placeholder="HRB 123456" maxLength={30} /></div>
      <div><label style={labelStyle}>Kapazität (optional)</label><input style={inputStyle} value={value.capacity} onChange={set('capacity')} placeholder="z.B. 250" inputMode="numeric" maxLength={6} /></div>
    </div>
  );
}

export function StepVenueLogo({ preview, onFile }: { preview: string | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl transition-shadow hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
        style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px dashed rgba(255,255,255,0.25)' }}
      >
        {preview ? <img src={preview} alt="Logo" className="h-full w-full object-cover" /> : <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Logo wählen</span>}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && f.size <= 5 * 1024 * 1024) onFile(f);
        }}
      />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>PNG, JPG oder WebP, max. 5 MB. Optional.</p>
    </div>
  );
}

export function StepVenueAgreement({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3" style={{ color: '#fff', fontSize: 15 }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1, accentColor: '#7C3AED' }} />
      <span>
        Ich akzeptiere die Feyrn-Mandatsvereinbarung (v1).
        <span style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>
          Wir geben Daten an dich nur aggregiert weiter, nie personenbezogen.
        </span>
      </span>
    </label>
  );
}
