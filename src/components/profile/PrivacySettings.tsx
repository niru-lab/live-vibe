import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Eye, ChatCircle, MapPin, MagnifyingGlass, Users, PauseCircle, Trash, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PrivacySettingsProps { open: boolean; onOpenChange: (open: boolean) => void; }

const DELETE_REASONS = [
  { value: 'not_useful', label: 'Ich nutze die App nicht mehr' },
  { value: 'too_much_time', label: 'Ich verbringe zu viel Zeit hier' },
  { value: 'privacy_concerns', label: 'Datenschutz-Bedenken' },
  { value: 'bad_experience', label: 'Negative Erfahrungen / Belästigung' },
  { value: 'missing_features', label: 'Fehlende Funktionen' },
  { value: 'switched_platform', label: 'Wechsel zu anderer Plattform' },
  { value: 'too_many_notifications', label: 'Zu viele Benachrichtigungen' },
  { value: 'content_quality', label: 'Inhaltsqualität nicht zufriedenstellend' },
  { value: 'other', label: 'Sonstiges' },
];

export const PrivacySettings = ({ open, onOpenChange }: PrivacySettingsProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [whoCanMessage, setWhoCanMessage] = useState('followers');
  const [showLocation, setShowLocation] = useState(true);
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [showEventsAttended, setShowEventsAttended] = useState(true);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'closed' | 'reason' | 'confirm'>('closed');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try { toast.success('Konto deaktiviert.'); await signOut(); onOpenChange(false); navigate('/auth'); }
    catch { toast.error('Fehler beim Deaktivieren'); }
    finally { setDeactivating(false); setDeactivateOpen(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { toast.error('Bitte gib dein Passwort ein'); return; }
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Kein User');
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: deletePassword });
      if (signInError) { toast.error('Falsches Passwort'); setDeleting(false); return; }
      toast.success('Dein Konto wird gelöscht.');
      await signOut(); onOpenChange(false); setDeleteStep('closed'); navigate('/auth');
    } catch { toast.error('Fehler beim Löschen des Kontos'); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle className="text-left">🔒 Privacy</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Eye weight="thin" className="h-4 w-4" />Profil-Sichtbarkeit</div>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">🌍 Öffentlich</SelectItem>
                  <SelectItem value="followers">👥 Nur Follower</SelectItem>
                  <SelectItem value="private">🔒 Privat</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Wer kann dein Profil und deine Posts sehen</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ChatCircle weight="thin" className="h-4 w-4" />Nachrichten von</div>
              <Select value={whoCanMessage} onValueChange={setWhoCanMessage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="everyone">Alle</SelectItem><SelectItem value="followers">Nur Follower</SelectItem><SelectItem value="nobody">Niemand</SelectItem></SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><MagnifyingGlass weight="thin" className="h-4 w-4" />Auffindbarkeit</div>
              <div className="flex items-center justify-between"><Label htmlFor="discover" className="flex items-center gap-2 cursor-pointer"><MagnifyingGlass weight="thin" className="h-4 w-4 text-muted-foreground" />In Discover anzeigen</Label><Switch id="discover" checked={showInDiscover} onCheckedChange={setShowInDiscover} /></div>
              <div className="flex items-center justify-between"><Label htmlFor="location" className="flex items-center gap-2 cursor-pointer"><MapPin weight="thin" className="h-4 w-4 text-muted-foreground" />Standort auf Posts zeigen</Label><Switch id="location" checked={showLocation} onCheckedChange={setShowLocation} /></div>
              <div className="flex items-center justify-between"><Label htmlFor="online" className="flex items-center gap-2 cursor-pointer"><Users weight="thin" className="h-4 w-4 text-muted-foreground" />Online-Status zeigen</Label><Switch id="online" checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} /></div>
              <div className="flex items-center justify-between"><Label htmlFor="events" className="flex items-center gap-2 cursor-pointer"><Users weight="thin" className="h-4 w-4 text-muted-foreground" />Besuchte Events anzeigen</Label><Switch id="events" checked={showEventsAttended} onCheckedChange={setShowEventsAttended} /></div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Warning weight="thin" className="h-4 w-4" />Konto</div>
              <Button variant="outline" className="w-full justify-start gap-3 h-11 border-muted-foreground/20" onClick={() => setDeactivateOpen(true)}>
                <PauseCircle weight="thin" className="h-4 w-4 text-muted-foreground" />
                <div className="text-left"><span className="block text-sm">Konto deaktivieren</span><span className="block text-xs text-muted-foreground">Pausiere dein Konto vorübergehend</span></div>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteStep('reason')}>
                <Trash weight="thin" className="h-4 w-4" />
                <div className="text-left"><span className="block text-sm">Konto endgültig löschen</span><span className="block text-xs opacity-70">Alle Daten werden unwiderruflich entfernt</span></div>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><PauseCircle weight="thin" className="h-5 w-5" />Konto deaktivieren</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <span className="block">Wenn du dein Konto deaktivierst:</span>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Dein Profil wird für andere unsichtbar</li><li>Deine Posts und Events bleiben gespeichert</li>
                <li>Nach <strong>30 Tagen</strong> wird es automatisch reaktiviert</li><li>Du kannst dich jederzeit wieder anmelden</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={deactivating}>{deactivating ? 'Wird deaktiviert...' : 'Konto deaktivieren'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteStep === 'reason'} onOpenChange={(o) => !o && setDeleteStep('closed')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><Trash weight="thin" className="h-5 w-5" />Warum möchtest du dein Konto löschen?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <span className="block text-sm text-muted-foreground">Dein Feedback hilft uns, die App zu verbessern.</span>
                <Select value={deleteReason} onValueChange={setDeleteReason}>
                  <SelectTrigger><SelectValue placeholder="Grund auswählen..." /></SelectTrigger>
                  <SelectContent>{DELETE_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteStep('closed')}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => setDeleteStep('confirm')} disabled={!deleteReason} className="bg-destructive hover:bg-destructive/80 text-destructive-foreground">Weiter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteStep === 'confirm'} onOpenChange={(o) => !o && setDeleteStep('closed')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><Warning weight="thin" className="h-5 w-5" />Endgültige Löschung bestätigen</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <span className="block text-sm text-muted-foreground">Diese Aktion kann nicht rückgängig gemacht werden.</span>
                <div className="space-y-2">
                  <Label htmlFor="delete-password" className="text-sm font-medium text-foreground">Passwort zur Bestätigung</Label>
                  <Input id="delete-password" type="password" placeholder="Dein Passwort eingeben" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteStep('closed'); setDeletePassword(''); }}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={!deletePassword || deleting} className="bg-destructive hover:bg-destructive/80 text-destructive-foreground">{deleting ? 'Wird gelöscht...' : 'Konto endgültig löschen'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
