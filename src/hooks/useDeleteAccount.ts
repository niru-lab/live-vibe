import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DeleteAccountState = 'idle' | 'confirming' | 'deleting' | 'success' | 'error';

export function useDeleteAccount() {
  const [state, setState] = useState<DeleteAccountState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const requestDelete = () => setState('confirming');
  const cancelDelete = () => { setState('idle'); setErrorMessage(null); };

  const confirmDelete = async () => {
    setState('deleting');
    setErrorMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState('error');
        setErrorMessage('Keine aktive Sitzung. Bitte neu anmelden.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || !data?.success) {
        setState('error');
        setErrorMessage('Löschung fehlgeschlagen. Kontaktiere hello@feyrn.de');
        return;
      }

      setState('success');
      await supabase.auth.signOut();
      toast({ title: 'Konto gelöscht', description: 'Alle deine Daten wurden entfernt.' });
      setTimeout(() => navigate('/welcome', { replace: true }), 1500);

    } catch {
      setState('error');
      setErrorMessage('Verbindungsfehler. Bitte versuche es erneut.');
    }
  };

  return {
    state, errorMessage,
    isConfirming: state === 'confirming',
    isDeleting: state === 'deleting',
    isSuccess: state === 'success',
    isError: state === 'error',
    requestDelete, cancelDelete, confirmDelete,
  };
}
