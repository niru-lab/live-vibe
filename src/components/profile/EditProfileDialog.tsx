import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Check, X, SpinnerGap } from '@phosphor-icons/react';
import { useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Profile } from '@/hooks/useProfile';

interface EditProfileDialogProps { open: boolean; onOpenChange: (open: boolean) => void; profile: Profile | null; }

export const EditProfileDialog = ({ open, onOpenChange, profile }: EditProfileDialogProps) => {
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(profile?.username || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showBadgeInBio, setShowBadgeInBio] = useState((profile as any)?.show_badge_in_bio ?? false);
  const [showScInBio, setShowScInBio] = useState((profile as any)?.show_sc_in_bio ?? false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && profile) {
      setUsername(profile.username || ''); setDisplayName(profile.display_name || '');
      setBio(profile.bio || ''); setCity(profile.city || '');
      setAvatarUrl(profile.avatar_url || ''); setAvatarFile(null); setUsernameAvailable(null);
      setShowBadgeInBio((profile as any)?.show_badge_in_bio ?? false);
      setShowScInBio((profile as any)?.show_sc_in_bio ?? false);
    }
    onOpenChange(isOpen);
  };

  const checkUsernameAvailability = async (newUsername: string) => {
    if (newUsername === profile?.username) { setUsernameAvailable(true); return; }
    if (newUsername.length < 3) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    const { data } = await supabase.from('profiles').select('id').eq('username', newUsername.toLowerCase()).maybeSingle();
    setUsernameAvailable(!data); setCheckingUsername(false);
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized); checkUsernameAvailability(sanitized);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarUrl(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      let finalAvatarUrl = profile?.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('post-media').upload(`avatars/${fileName}`, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(`avatars/${fileName}`);
        finalAvatarUrl = publicUrl;
      }
      await updateProfile.mutateAsync({
        username: username !== profile?.username ? username : undefined,
        display_name: displayName, bio: bio || null, city: city || null, avatar_url: finalAvatarUrl,
        show_badge_in_bio: showBadgeInBio, show_sc_in_bio: showScInBio,
      } as any);
      toast.success('Profil aktualisiert!'); onOpenChange(false);
    } catch (error: any) { toast.error(error.message || 'Fehler beim Speichern'); }
    finally { setIsUploading(false); }
  };

  const canSave = !isUploading && displayName.trim().length > 0 && username.length >= 3 && (usernameAvailable === true || username === profile?.username);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Profil bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-muted">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl text-primary-foreground">{displayName?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <Button type="button" size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" onClick={() => fileInputRef.current?.click()}>
                <Camera weight="thin" className="h-4 w-4" />
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tippe, um Profilbild zu ändern</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input id="username" value={username} onChange={(e) => handleUsernameChange(e.target.value)} className="pl-8 pr-10" placeholder="dein_username" maxLength={30} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername ? <SpinnerGap weight="thin" className="h-4 w-4 animate-spin text-muted-foreground" />
                  : usernameAvailable === true ? <Check weight="thin" className="h-4 w-4 text-green-500" />
                  : usernameAvailable === false ? <X weight="thin" className="h-4 w-4 text-destructive" /> : null}
              </div>
            </div>
            {usernameAvailable === false && <p className="text-xs text-destructive">Benutzername bereits vergeben</p>}
          </div>
          <div className="space-y-2"><Label htmlFor="displayName">Anzeigename</Label><Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Dein Name" maxLength={50} /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label htmlFor="bio">Bio</Label><span className="text-xs text-muted-foreground">{bio.length}/150</span></div>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 150))} placeholder="Erzähl etwas über dich..." rows={3} maxLength={150} />
          </div>
          <div className="space-y-2"><Label htmlFor="city">Stadt</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="z.B. Stuttgart" maxLength={50} /></div>
          <div className="space-y-3 rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium">Bio-Anzeige</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-badge" className="text-sm text-muted-foreground">Rang in Bio anzeigen</Label>
              <Switch id="show-badge" checked={showBadgeInBio} onCheckedChange={setShowBadgeInBio} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-sc" className="text-sm text-muted-foreground">SC-Punkte in Bio anzeigen</Label>
              <Switch id="show-sc" checked={showScInBio} onCheckedChange={setShowScInBio} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isUploading ? (<><SpinnerGap weight="thin" className="mr-2 h-4 w-4 animate-spin" />Speichern...</>) : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
