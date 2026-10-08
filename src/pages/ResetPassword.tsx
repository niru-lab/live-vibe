import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Recovery-Link landet mit type=recovery im URL-Hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Zu kurz', description: 'Passwort muss mindestens 6 Zeichen haben.' });
      return;
    }
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Nicht identisch', description: 'Die Passwörter stimmen nicht überein.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Fehler', description: error.message });
    } else {
      toast({ title: 'Passwort geändert ✅', description: 'Du kannst dich jetzt anmelden.' });
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center justify-center">
        <FeyrnLogo size="lg" asLink={false} />
      </div>
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-center text-lg">Neues Passwort setzen</CardTitle>
        </CardHeader>
        <CardContent>
          {isRecovery ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <Input id="new-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort wiederholen</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Dieser Link ist ungültig oder abgelaufen. Fordere auf der Anmeldeseite einen neuen Link an.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
