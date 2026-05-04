import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, X } from '@phosphor-icons/react';

interface Props {
  username: string;
  userId: string;
  onChange: (v: string) => void;
  onValidityChange: (valid: boolean) => void;
}

const RESERVED = ['admin', 'feyrn', 'test', 'support', 'root'];
const RE = /^[a-z0-9_]{3,20}$/;

export default function StepUsername({ username, userId, onChange, onValidityChange }: Props) {
  const [status, setStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken'>('idle');

  useEffect(() => {
    if (!username) { setStatus('idle'); onValidityChange(false); return; }
    if (!RE.test(username)) { setStatus('invalid'); onValidityChange(false); return; }
    if (RESERVED.some(r => username.includes(r))) {
      setStatus('taken'); onValidityChange(false); return;
    }
    setStatus('checking'); onValidityChange(false);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles').select('id').eq('username', username).neq('user_id', userId).maybeSingle();
      if (data) { setStatus('taken'); onValidityChange(false); }
      else { setStatus('available'); onValidityChange(true); }
    }, 600);
    return () => clearTimeout(t);
  }, [username, userId, onValidityChange]);

  const borderColor =
    status === 'available' ? '#22c55e' :
    status === 'taken' || status === 'invalid' ? '#EC4899' :
    'rgba(255,255,255,0.1)';

  return (
    <div className="space-y-2">
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
            color: '#a78bfa', fontSize: 17, fontWeight: 600,
          }}
        >@</span>
        <input
          type="text"
          value={username}
          onChange={e => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
          placeholder="deinname"
          autoFocus
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: `0.5px solid ${borderColor}`,
            borderRadius: 14,
            color: '#fff',
            padding: '16px 44px 16px 36px',
            fontSize: 17,
            fontWeight: 500,
            outline: 'none',
            backdropFilter: 'blur(12px)',
            transition: 'border-color 200ms',
          }}
        />
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
          {status === 'checking' && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full" style={{ border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa' }} />
          )}
          {status === 'available' && <Check size={20} weight="bold" color="#22c55e" />}
          {(status === 'taken' || status === 'invalid') && <X size={20} weight="bold" color="#EC4899" />}
        </span>
      </div>
      {status === 'available' && (
        <p style={{ color: '#22c55e', fontSize: 13, fontWeight: 500 }}>Verfügbar</p>
      )}
      {status === 'taken' && (
        <p style={{ color: '#EC4899', fontSize: 13, fontWeight: 500 }}>Bereits vergeben</p>
      )}
      {status === 'invalid' && username.length > 0 && (
        <p style={{ color: '#EC4899', fontSize: 13, fontWeight: 500 }}>Ungültiges Format</p>
      )}
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        3–20 Zeichen · nur Buchstaben, Zahlen & _
      </p>
    </div>
  );
}
