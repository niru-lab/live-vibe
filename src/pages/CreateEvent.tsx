import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCreateEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { MusicSelector, type MusicTrack } from '@/components/create/MusicSelector';
import { FollowerInviteSelector } from '@/components/create/FollowerInviteSelector';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Euro,
  Shirt,
  Info,
  Camera,
  X,
  Plus,
  Music,
  Sparkles,
  QrCode,
  Globe,
  Users as UsersIcon,
  Lock,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

const eventSchema = z.object({
  name: z.string().min(3, 'Name muss mindestens 3 Zeichen haben'),
  description: z.string().optional(),
  location_name: z.string().min(2, 'Location ist erforderlich'),
  area: z.string().min(2, 'Gebiet ist erforderlich (z.B. Stuttgart West)'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  starts_at: z.date({ required_error: 'Datum ist erforderlich' }),
  starts_at_time: z.string().min(1, 'Startzeit ist erforderlich'),
  ends_at_time: z.string().optional(),
  expected_attendees: z.number().min(1).optional(),
  is_free: z.boolean(),
  entry_price: z.number().min(0).optional(),
  dresscode: z.string().optional(),
  dos_and_donts: z.string().optional(),
  category: z.enum(['club', 'house_party', 'bar', 'festival', 'concert', 'sport', 'other']),
});

type EventFormData = z.infer<typeof eventSchema>;

const categories = [
  { value: 'club', label: '🎧 Club', emoji: '🎧' },
  { value: 'house_party', label: '🏠 Hausparty', emoji: '🏠' },
  { value: 'bar', label: '🍸 Bar', emoji: '🍸' },
  { value: 'festival', label: '🎪 Festival', emoji: '🎪' },
  { value: 'concert', label: '🎤 Konzert', emoji: '🎤' },
  { value: 'sport', label: '⚽ Sport', emoji: '⚽' },
  { value: 'other', label: '✨ Andere', emoji: '✨' },
];

const germanCities = [
  'Stuttgart', 'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt',
  'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden',
];

const visibilityOptions = [
  { id: 'public', icon: Globe, label: 'Öffentlich', description: 'Alle können sehen' },
  { id: 'friends', icon: UsersIcon, label: 'Freunde', description: 'Nur Freunde' },
  { id: 'private', icon: Lock, label: 'Privat', description: 'Nur eingeladene' },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const createEvent = useCreateEvent();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [visibility, setVisibility] = useState('public');
  const [isUploading, setIsUploading] = useState(false);
  const [generateQR, setGenerateQR] = useState(false);
  const [invitedFollowers, setInvitedFollowers] = useState<string[]>([]);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      location_name: '',
      area: '',
      city: '',
      is_free: true,
      entry_price: 0,
      category: 'other',
      starts_at_time: '22:00',
      ends_at_time: '04:00',
    },
  });

  const isFree = form.watch('is_free');
  const watchedCity = form.watch('city');

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

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsUploading(true);

    try {
      // Upload cover image if available
      let coverImageUrl = null;
      if (mediaItems.length > 0) {
        const coverItem = mediaItems[0];
        const fileExt = coverItem.file.name.split('.').pop();
        const fileName = `events/${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, coverItem.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(fileName);

        coverImageUrl = publicUrl;
      }

      const [hours, minutes] = data.starts_at_time.split(':').map(Number);
      const startsAt = new Date(data.starts_at);
      startsAt.setHours(hours, minutes, 0, 0);

      let endsAt = null;
      if (data.ends_at_time) {
        const [endHours, endMinutes] = data.ends_at_time.split(':').map(Number);
        endsAt = new Date(data.starts_at);
        // If end time is before start time, assume next day
        if (endHours < hours || (endHours === hours && endMinutes < minutes)) {
          endsAt.setDate(endsAt.getDate() + 1);
        }
        endsAt.setHours(endHours, endMinutes, 0, 0);
      }

      const newEvent = await createEvent.mutateAsync({
        name: data.name,
        description: data.description || null,
        location_name: data.location_name,
        address: data.area,
        city: data.city,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt?.toISOString() || null,
        expected_attendees: data.expected_attendees || null,
        is_free: data.is_free,
        entry_price: data.is_free ? 0 : (data.entry_price || 0),
        dresscode: data.dresscode || null,
        dos_and_donts: data.dos_and_donts || null,
        category: data.category,
        cover_image_url: coverImageUrl,
      });

      // Send invitations to selected followers
      if (invitedFollowers.length > 0 && newEvent?.id) {
        const invitations = invitedFollowers.map((userId) => ({
          event_id: newEvent.id,
          user_id: userId,
          status: 'invited' as const,
        }));

        await supabase.from('event_attendees').insert(invitations);
      }

      toast({
        title: 'Event erstellt! 🎉',
        description: invitedFollowers.length > 0
          ? `Dein Event ist live. ${invitedFollowers.length} Einladung${invitedFollowers.length > 1 ? 'en' : ''} verschickt!`
          : 'Dein Event ist jetzt live und erscheint im Feed.',
      });

      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Event konnte nicht erstellt werden.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const estimatedPoints = Math.min(20 + (mediaItems.length * 5), 50);

  return (
    <AppLayout hideNav>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold">Neues Event</h1>
            <p className="text-xs text-muted-foreground">Party erstellen</p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          className="bg-gradient-to-r from-pink-500 to-orange-500"
          disabled={createEvent.isPending || isUploading}
        >
          {isUploading ? 'Lädt...' : 'Erstellen 🎉'}
        </Button>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 pb-8">
          {/* Media Carousel Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Event-Medien</Label>
              <span className="text-xs text-muted-foreground">{mediaItems.length}/10</span>
            </div>

            {mediaItems.length > 0 ? (
              <>
                {/* Main Preview */}
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
                  {mediaItems[currentSlide]?.type === 'video' ? (
                    <video
                      src={mediaItems[currentSlide].previewUrl}
                      className="h-full w-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={mediaItems[currentSlide]?.previewUrl}
                      alt="Event cover"
                      className="h-full w-full object-cover"
                    />
                  )}

                  {/* Dots */}
                  {mediaItems.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {mediaItems.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentSlide(index)}
                          className={cn(
                            'h-2 w-2 rounded-full transition-all',
                            index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-5 gap-2">
                  {mediaItems.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => setCurrentSlide(index)}
                      className={cn(
                        'group relative aspect-square cursor-pointer overflow-hidden rounded-lg',
                        currentSlide === index && 'ring-2 ring-primary'
                      )}
                    >
                      {item.type === 'video' ? (
                        <div className="relative h-full w-full">
                          <video src={item.previewUrl} className="h-full w-full object-cover" />
                          <Play className="absolute inset-0 m-auto h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMediaItem(item.id);
                        }}
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {mediaItems.length < 10 && (
                    <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/50 transition hover:border-primary/50">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFilesSelect}
                      />
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </label>
                  )}
                </div>
              </>
            ) : (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelect}
                />
                <Camera className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">Event-Foto/Video</p>
                <p className="text-sm text-muted-foreground">Carousel: bis 10 Medien</p>
              </label>
            )}
          </div>

          {/* Music Selector */}
          <div className="space-y-2 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Music className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Event-Soundtrack</h2>
            </div>
            <MusicSelector selectedTrack={selectedMusic} onSelect={setSelectedMusic} />
          </div>

          {/* Basic Info */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <h2 className="font-semibold text-foreground">📝 Event-Details</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event-Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='z.B. "Techno Mondays @ Proton"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie *</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => field.onChange(cat.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all',
                          field.value === cat.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border/50 hover:border-primary/50'
                        )}
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <span className="text-xs font-medium">{cat.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Erzähle mehr über dein Event..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">📍 Location</h2>
            </div>

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stadt *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Stadt wählen (Auto-Suche)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {germanCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location-Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Club Proton" {...field} />
                  </FormControl>
                  {field.value && watchedCity && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Post auto ins Club-Profil?
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gebiet / Stadtteil *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Stuttgart West, Mitte, Ost..." {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Wichtig für die Heatmap - genaue Adresse erst nach Zusage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">🕒 Datum & Uhrzeit</h2>
            </div>

            <FormField
              control={form.control}
              name="starts_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Datum *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Datum wählen</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="starts_at_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ends_at_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ende</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Attendees & Price */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">👥 Gäste & Eintritt</h2>
            </div>

            <FormField
              control={form.control}
              name="expected_attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Erwartete Gäste</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="z.B. 150-250"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Vorschlag basierend auf Location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_free"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <FormLabel className="text-base">Kostenloser Eintritt</FormLabel>
                    <FormDescription>Event ist kostenlos</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isFree && (
              <FormField
                control={form.control}
                name="entry_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eintrittspreis (€)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="15.00"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Dresscode & Rules */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">👗 Style & Regeln</h2>
            </div>

            <FormField
              control={form.control}
              name="dresscode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dresscode</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Smart Casual | Streetwear" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dos_and_donts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dos & Don'ts</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="✅ Dos: Positive Vibes | Tanzen&#10;❌ Don'ts: Kein Handy im Darkroom | Respekt"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Visibility & QR */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Sichtbarkeit</h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setVisibility(option.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all',
                      visibility === option.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-primary/50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-3">
                <QrCode className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">QR-Code generieren</p>
                  <p className="text-xs text-muted-foreground">Für Event-Einladungen</p>
                </div>
              </div>
              <Switch checked={generateQR} onCheckedChange={setGenerateQR} />
            </div>
          </div>


          {/* Follower einladen */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <FollowerInviteSelector
              selectedIds={invitedFollowers}
              onSelectionChange={setInvitedFollowers}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 py-6 text-lg"
            disabled={createEvent.isPending || isUploading}
          >
            {isUploading ? 'Medien werden hochgeladen...' : 'Event erstellen 🎉'}
          </Button>
        </form>
      </Form>
    </AppLayout>
  );
}
