import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCreateEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Users, Euro, Shirt, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const eventSchema = z.object({
  name: z.string().min(3, 'Name muss mindestens 3 Zeichen haben'),
  description: z.string().optional(),
  location_name: z.string().min(2, 'Location ist erforderlich'),
  address: z.string().min(5, 'Adresse ist erforderlich'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  starts_at: z.date({ required_error: 'Datum ist erforderlich' }),
  starts_at_time: z.string().min(1, 'Uhrzeit ist erforderlich'),
  expected_attendees: z.number().min(1).optional(),
  is_free: z.boolean(),
  entry_price: z.number().min(0).optional(),
  dresscode: z.string().optional(),
  dos_and_donts: z.string().optional(),
  category: z.enum(['club', 'house_party', 'bar', 'festival', 'concert', 'other']),
});

type EventFormData = z.infer<typeof eventSchema>;

const categories = [
  { value: 'club', label: '🎧 Club' },
  { value: 'house_party', label: '🏠 Hausparty' },
  { value: 'bar', label: '🍸 Bar' },
  { value: 'festival', label: '🎪 Festival' },
  { value: 'concert', label: '🎤 Konzert' },
  { value: 'other', label: '✨ Andere' },
];

const germanCities = [
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart',
  'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden',
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const createEvent = useCreateEvent();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      location_name: '',
      address: '',
      city: '',
      is_free: true,
      entry_price: 0,
      category: 'other',
      starts_at_time: '22:00',
    },
  });

  const isFree = form.watch('is_free');

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const [hours, minutes] = data.starts_at_time.split(':').map(Number);
      const startsAt = new Date(data.starts_at);
      startsAt.setHours(hours, minutes, 0, 0);

      await createEvent.mutateAsync({
        name: data.name,
        description: data.description || null,
        location_name: data.location_name,
        address: data.address,
        city: data.city,
        starts_at: startsAt.toISOString(),
        expected_attendees: data.expected_attendees || null,
        is_free: data.is_free,
        entry_price: data.is_free ? 0 : (data.entry_price || 0),
        dresscode: data.dresscode || null,
        dos_and_donts: data.dos_and_donts || null,
        category: data.category,
      });

      toast({
        title: 'Event erstellt! 🎉',
        description: 'Dein Event ist jetzt live.',
      });

      navigate('/events');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Event konnte nicht erstellt werden.',
      });
    }
  };

  return (
    <AppLayout hideNav>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">Event erstellen</h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
          {/* Basic Info */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <h2 className="font-semibold text-foreground">Grundinfos</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event-Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Techno Night @ Club XY" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wähle eine Kategorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Erzähle mehr über dein Event..."
                      className="min-h-[100px]"
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
              <h2 className="font-semibold text-foreground">Location</h2>
            </div>

            <FormField
              control={form.control}
              name="location_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location-Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Club Matrix" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse *</FormLabel>
                  <FormControl>
                    <Input placeholder="Straße, Hausnummer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stadt *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Stadt wählen" />
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
          </div>

          {/* Date & Time */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Datum & Uhrzeit</h2>
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
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Datum wählen</span>
                          )}
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

            <FormField
              control={form.control}
              name="starts_at_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uhrzeit *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Details */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Details</h2>
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
                        placeholder="z.B. 100"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                  </FormControl>
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
                          placeholder="0.00"
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

            <FormField
              control={form.control}
              name="dresscode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dresscode</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Shirt className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="z.B. Casual, Schwarz" className="pl-10" {...field} />
                    </div>
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
                      placeholder="z.B. Kein Eintritt nach 2 Uhr, Rauchen nur draußen..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent py-6 text-lg"
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? 'Wird erstellt...' : 'Event erstellen 🎉'}
          </Button>
        </form>
      </Form>
    </AppLayout>
  );
}
