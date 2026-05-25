export interface ContactData { phone: string; whatsapp_ok: boolean; }

interface Props { value: ContactData; onChange: (v: ContactData) => void; }

export default function StepVenueContact({ value, onChange }: Props) {
  return (
    <div>
      <input
        type="tel"
        inputMode="tel"
        autoFocus
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
        placeholder="0151 ..."
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          color: '#fff',
          padding: '16px 16px',
          fontSize: 16,
          outline: 'none',
          marginBottom: 14,
        }}
      />
      <button
        onClick={() => onChange({ ...value, whatsapp_ok: !value.whatsapp_ok })}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: 14,
          background: value.whatsapp_ok ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
          border: value.whatsapp_ok ? '1px solid rgba(34, 197, 94, 0.6)' : '0.5px solid rgba(255,255,255,0.1)',
          transition: 'all 180ms', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: value.whatsapp_ok ? '#22c55e' : 'transparent',
            border: value.whatsapp_ok ? 'none' : '0.5px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
          }}
        >
          {value.whatsapp_ok ? '✓' : ''}
        </div>
        <span style={{ color: '#fff', fontSize: 14 }}>
          WhatsApp? Dann schreiben wir dir da
        </span>
      </button>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, textAlign: 'center' }}>
        Nur für uns — Gäste sehen das nicht
      </p>
    </div>
  );
}
