import { useState, useCallback } from 'react';
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
import {
  ArrowLeft,
  Plus,
  X,
  MapPin,
  Sparkles,
  Zap,
  Loader2,
  Clock,
  GripVertical,
  Play,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export default function CreateCarousel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const createPost = useCreatePost();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isMomentX, setIsMomentX] = useState(false);
  const [is24hPost, setIs24hPost] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const handleFilesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = 10 - mediaItems.length;
    const newFiles = Array.from(files).slice(0, remainingSlots);

    const newMediaItems: MediaItem[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }));

    setMediaItems((prev) => [...prev, ...newMediaItems]);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((m) => m.id !== id);
    });
    if (currentSlide >= mediaItems.length - 1) {
      setCurrentSlide(Math.max(0, mediaItems.length - 2));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newItems = [...mediaItems];
    const [removed] = newItems.splice(draggedItem, 1);
    newItems.splice(index, 0, removed);
    setMediaItems(newItems);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSubmit = async () => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (mediaItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Keine Medien',
        description: 'Bitte füge mindestens ein Foto oder Video hinzu.',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload all files and create posts for each
      const expiresAt = is24hPost
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, item.file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('post-media').getPublicUrl(fileName);

        // For carousel, we'll create separate posts but with the same timestamp
        // to group them together visually
        await createPost.mutateAsync({
          media_url: publicUrl,
          media_type: item.type,
          caption: i === 0 ? caption || null : null, // Only first slide has caption
          location_name: i === 0 ? location || null : null,
          is_moment_x: isMomentX,
          music_url: i === 0 ? selectedMusic?.url || null : null,
          music_title: i === 0 ? selectedMusic?.title || null : null,
          music_artist: i === 0 ? selectedMusic?.artist || null : null,
          expires_at: expiresAt,
        });
      }

      toast({
        title: 'Carousel gepostet! 🎉',
        description: `${mediaItems.length} Medien wurden erfolgreich geteilt.`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler beim Upload',
        description: error.message || 'Bitte versuche es erneut.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppLayout hideNav>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold">Carousel</h1>
            <p className="text-xs text-muted-foreground">
              {mediaItems.length}/10 Medien
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-primary to-accent"
          disabled={mediaItems.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lädt...
            </>
          ) : (
            'Teilen'
          )}
        </Button>
      </header>

      <div className="p-4 space-y-6">
        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Moment-X</span>
            </div>
            <Switch checked={isMomentX} onCheckedChange={setIsMomentX} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">24h</span>
            </div>
            <Switch checked={is24hPost} onCheckedChange={setIs24hPost} />
          </div>
        </div>

        {/* Media Carousel Preview */}
        {mediaItems.length > 0 && (
          <div className="space-y-3">
            <Label>Vorschau</Label>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              {mediaItems[currentSlide]?.type === 'video' ? (
                <video
                  src={mediaItems[currentSlide].previewUrl}
                  className="h-full w-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={mediaItems[currentSlide]?.previewUrl}
                  alt={`Slide ${currentSlide + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
              
              {/* Slide indicators */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {mediaItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all',
                      index === currentSlide
                        ? 'bg-white w-4'
                        : 'bg-white/50 hover:bg-white/70'
                    )}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              {currentSlide > 0 && (
                <button
                  onClick={() => setCurrentSlide((prev) => prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                >
                  ←
                </button>
              )}
              {currentSlide < mediaItems.length - 1 && (
                <button
                  onClick={() => setCurrentSlide((prev) => prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Media Grid (Drag to Reorder) */}
        <div className="space-y-3">
          <Label>Medien ({mediaItems.length}/10)</Label>
          <div className="grid grid-cols-4 gap-2">
            {mediaItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 border-transparent transition-all',
                  draggedItem === index && 'opacity-50 border-primary',
                  currentSlide === index && 'ring-2 ring-primary'
                )}
                onClick={() => setCurrentSlide(index)}
              >
                {item.type === 'video' ? (
                  <div className="relative h-full w-full">
                    <video
                      src={item.previewUrl}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.previewUrl}
                    alt={`Media ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMediaItem(item.id);
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">
                  {index + 1}
                </div>
                <GripVertical className="absolute left-1 top-1 h-4 w-4 text-white opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}

            {/* Add more button */}
            {mediaItems.length < 10 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelect}
                />
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="mt-1 text-xs text-muted-foreground">
                  +{10 - mediaItems.length}
                </span>
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Ziehe zum Neu-Anordnen. Tippe zum Vorschau anzeigen.
          </p>
        </div>

        {/* Initial Upload Area */}
        {mediaItems.length === 0 && (
          <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFilesSelect}
            />
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="flex gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Video className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  Bis zu 10 Fotos/Videos auswählen
                </p>
                <p className="text-sm">Tippe zum Hochladen</p>
              </div>
            </div>
          </label>
        )}

        {/* Music Selector */}
        <div className="space-y-2">
          <Label>Musik (für alle Slides)</Label>
          <MusicSelector
            selectedTrack={selectedMusic}
            onSelect={setSelectedMusic}
          />
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption">Beschreibung</Label>
          <Textarea
            id="caption"
            placeholder="Was geht gerade ab? 🎉"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="location"
              placeholder="Wo bist du gerade?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
