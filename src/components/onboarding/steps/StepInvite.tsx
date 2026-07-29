import { useState } from 'react';
import { UsersThree, ShareNetwork, Check } from '@phosphor-icons/react';

const SHARE_TEXT = 'Komm zu Feyrn — da siehst du, wo heute was geht. 🔥';

export default function StepInvite() {
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    setError(null);
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Feyrn', text: SHARE_TEXT, url });
        setShared(true);
        return;
      }
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      setShared(true);
    } catch (e) {
      // User cancelled the native share sheet — never block completion.
      if ((e as Error)?.name === 'AbortError') return;
      setError('Teilen hat nicht geklappt — du kannst trotzdem weiter.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(124, 58, 237, 0.18)',
          border: '0.5px solid rgba(255,255,255,0.12)',
        }}
      >
        <UsersThree size={28} weight="thin" color="#9d97e8" />
      </div>

      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
        Alleine ausgehen ist okay. Zu zweit ist besser.
        <br />
        Hol deine Leute dazu — oder mach einfach weiter.
      </p>

      <button
        onClick={handleInvite}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          padding: '14px 18px',
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.15)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {shared ? <Check size={18} weight="bold" color="#22c55e" /> : <ShareNetwork size={18} weight="thin" />}
        {shared ? 'Einladung geteilt' : 'Freunde einladen'}
      </button>

      {error && <p style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</p>}
    </div>
  );
}
