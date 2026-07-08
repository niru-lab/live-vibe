import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sparkle, Confetti } from '@phosphor-icons/react';
import { FeyrnLogo } from '@/components/brand/FeyrnLogo';
import { lovable } from '@/integrations/lovable/index';
import { z } from 'zod';

const emailSchema = z.string().email('Bitte gib eine gültige E-Mail-Adresse ein');
const passwordSchema = z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben');
const usernameSchema = z.string().min(3, 'Username muss mindestens 3 Zeichen haben').regex(/^[a-zA-Z0-9_]+$/, 'Nur Buchstaben, Zahlen und Unterstriche erlaubt');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});

  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role: 'guest' | 'venue_owner' | undefined = (location.state as { role?: 'guest' | 'venue_owner' } | null)?.role;
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = (isSignUp: boolean) => {
    const newErrors: { email?: string; password?: string; username?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    if (isSignUp && username) {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) newErrors.username = usernameResult.error.errors[0].message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Anmeldung fehlgeschlagen',
        description: error.message === 'Invalid login credentials' ? 'E-Mail oder Passwort ist falsch' : error.message,
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    setLoading(true);
    const { error } = await signUp(email, password, {
      username: username || undefined,
      display_name: username || undefined,
      role,
    });
    setLoading(false);
    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('already registered')) errorMessage = 'Diese E-Mail-Adresse ist bereits registriert';
      toast({ variant: 'destructive', title: 'Registrierung fehlgeschlagen', description: errorMessage });
    } else {
      toast({ title: 'Willkommen bei Feyrn! 🎉', description: 'Dein Account wurde erfolgreich erstellt.' });
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setLoading(false);
      toast({ variant: 'destructive', title: 'Google-Anmeldung fehlgeschlagen', description: error.message });
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <div className="relative z-10 mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <FeyrnLogo size="lg" asLink={false} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Entdecke, was gerade abgeht</p>
      </div>

      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        {role && (
          <span
            className="pointer-events-none absolute right-3 top-3 z-20 rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur"
          >
            {role === 'venue_owner' ? 'Als Venue anmelden' : 'Als Gast anmelden'}
          </span>
        )}
        <Tabs defaultValue="login" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Mit Google fortfahren
            </button>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs text-muted-foreground">oder</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail</Label>
                  <Input id="login-email" type="email" placeholder="deine@email.de" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Passwort</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Wird angemeldet...' : 'Anmelden'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-Mail</Label>
                  <Input id="register-email" type="email" placeholder="deine@email.de" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input id="register-username" type="text" placeholder="party_master" value={username} onChange={(e) => setUsername(e.target.value)} />
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                  <p className="text-xs text-muted-foreground">Wird auch als Anzeigename verwendet.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Passwort</Label>
                  <Input id="register-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Wird erstellt...' : (
                    <span className="flex items-center gap-2">
                      <Confetti weight="thin" className="h-4 w-4" />
                      Account erstellen
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <div className="relative z-10 mt-8 flex gap-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkle weight="thin" className="h-4 w-4" />
          <span>Live Events</span>
        </div>
        <div className="flex items-center gap-2">
          <Confetti weight="thin" className="h-4 w-4" />
          <span>Echte Momente</span>
        </div>
      </div>
    </div>
  );
}
