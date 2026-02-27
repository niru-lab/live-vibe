import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCreatePost } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MusicSelector, type MusicTrack } from '@/components/create/MusicSelector';
import { VenueEventSelector, type SelectedTag } from '@/components/create/VenueEventSelector';
import { ArrowLeft, Camera, VideoCamera, MapPin, Sparkle, Lightning, SpinnerGap, Clock, Tag } from '@phosphor-icons/react';

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const createPost = useCreatePost();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isMomentX, setIsMomentX] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [is24hPost, setIs24hPost] = useState(false);
  const [selectedTag, setSelectedTag] = useState<SelectedTag | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setSelectedFile(file); const url = URL.createObjectURL(file); setPreviewUrl(url); }
  };

  const handleSubmit = async () => {
    if (!user || !profile) { navigate('/auth'); return; }
    if (!selectedFile) { toast({ variant: 'destructive', title: 'Kein Bild/Video', description: 'Bitte wähle ein Foto oder Video aus.' }); return; }
    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('post-media').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(fileName);
      const mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
      const shouldExpire = is24hPost || selectedTag !== null;
      const expiresAt = shouldExpire ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

      await createPost.mutateAsync({
        media_url: publicUrl, media_type: mediaType, caption: caption || null, location_name: location || null, is_moment_x: isMomentX,
        music_url: selectedMusic?.url || null, music_title: selectedMusic?.title || null, music_artist: selectedMusic?.artist || null,
        expires_at: expiresAt, venue_id: selectedTag?.type === 'venue' ? selectedTag.id : null, event_id: selectedTag?.type === 'event' ? selectedTag.id : null,
      });
      toast({ title: 'Gepostet! 🎉', description: 'Dein Beitrag wurde erfolgreich geteilt.' });
      navigate('/');
    } catch (error: any) { console.error('Upload error:', error); toast({ variant: 'destructive', title: 'Fehler beim Upload', description: error.message || 'Bitte versuche es erneut.' }); }
    finally { setIsUploading(false); }
  };

  return (
    <AppLayout hideNav>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft weight="thin" className="h-5 w-5" /></Button><h1 className="font-display text-xl font-bold">Neuer Post</h1></div>
        <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-accent" disabled={!selectedFile || isUploading}>
          {isUploading ? (<><SpinnerGap weight="thin" className="mr-2 h-4 w-4 animate-spin" />Lädt...</>) : 'Teilen'}
        </Button>
      </header>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent"><Lightning weight="fill" className="h-5 w-5 text-primary-foreground" /></div>
            <div><h3 className="font-semibold text-foreground">Moment-X</h3><p className="text-sm text-muted-foreground">Der beste Moment des Abends</p></div>
          </div>
          <Switch checked={isMomentX} onCheckedChange={setIsMomentX} />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-orange-500"><Clock weight="fill" className="h-5 w-5 text-white" /></div>
            <div><h3 className="font-semibold text-foreground">Nur 24 Stunden</h3><p className="text-sm text-muted-foreground">Post löscht sich automatisch</p></div>
          </div>
          <Switch checked={is24hPost} onCheckedChange={setIs24hPost} />
        </div>
        <div className="space-y-3">
          <Label>Foto oder Video</Label>
          {previewUrl ? (
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              {selectedFile?.type.startsWith('video') ? <video src={previewUrl} className="h-full w-full object-cover" controls /> : <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />}
              <Button variant="secondary" size="sm" className="absolute bottom-3 right-3" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}>Ändern</Button>
            </div>
          ) : (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted">
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="flex gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Camera weight="thin" className="h-6 w-6 text-primary" /></div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10"><VideoCamera weight="thin" className="h-6 w-6 text-accent" /></div>
                </div>
                <div className="text-center"><p className="font-medium text-foreground">Foto oder Video auswählen</p><p className="text-sm">Tippe zum Hochladen</p></div>
              </div>
            </label>
          )}
        </div>
        <div className="space-y-2"><Label>Musik</Label><MusicSelector selectedTrack={selectedMusic} onSelect={setSelectedMusic} /></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Tag weight="thin" className="h-4 w-4 text-primary" /><Label>Venue oder Event markieren</Label></div>
          <VenueEventSelector selectedTag={selectedTag} onSelect={setSelectedTag} />
          {selectedTag && <p className="text-xs text-muted-foreground">⏱️ Post erscheint 24h im Feed von {selectedTag.name}</p>}
        </div>
        <div className="space-y-2"><Label htmlFor="caption">Beschreibung</Label><Textarea id="caption" placeholder="Was geht gerade ab? 🎉" value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[100px]" /></div>
        <div className="space-y-2"><Label htmlFor="location">Location</Label><div className="relative"><MapPin weight="thin" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="location" placeholder="Wo bist du gerade?" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10" /></div></div>
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Sparkle weight="thin" className="h-4 w-4 text-primary" />Tipps für mehr Reichweite</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground"><li>• Poste im besten Moment der Party</li><li>• Nutze Moment-X für maximale Sichtbarkeit</li><li>• Tagge die Location für Club-Integration</li></ul>
        </div>
      </div>
    </AppLayout>
  );
}
