import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEventById, useDeleteEvent } from '@/hooks/useEvents';
import {
  useEventAttendees,
  useUserEventRSVP,
  useRSVP,
  useFriendsAttending,
} from '@/hooks/useEventAttendees';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePendingAttendees } from '@/hooks/useEventMessages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { AttendeeManager } from '@/components/events/AttendeeManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Euro,
  Shirt,
  CheckCircle2,
  XCircle,
  Heart,
  MessageCircle,
  Share2,
  Navigation,
  QrCode,
  CalendarPlus,
  Sparkles,
  Flame,
  UserCheck,
  Crown,
  Settings,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryEmojis: Record<string, string> = {
  club: '🎧',
  house_party: '🏠',
  bar: '🍸',
  festival: '🎪',
  concert: '🎤',
  other: '✨',
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const { data: event, isLoading } = useEventById(id);
  const { data: attendees } = useEventAttendees(id);
  const { data: userRSVP } = useUserEventRSVP(id);
  const { data: friendsAttending } = useFriendsAttending(id);
  const rsvpMutation = useRSVP();
  const deleteEventMutation = useDeleteEvent();

  const [showAttendees, setShowAttendees] = useState(false);
  const [showAttendeeManager, setShowAttendeeManager] = useState(false);
  
  const { data: pendingAttendees } = usePendingAttendees(id);

  const handleDeleteEvent = async () => {
    if (!event) return;
    
    try {
      await deleteEventMutation.mutateAsync(event.id);
      toast({
        title: 'Event gelöscht',
        description: 'Das Event wurde erfolgreich entfernt.',
      });
      navigate('/events');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Event konnte nicht gelöscht werden.',
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout hideNav>
        <div className="p-4 space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout hideNav>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold">Event nicht gefunden</h2>
          <p className="text-muted-foreground mt-2">Das Event existiert nicht mehr.</p>
          <Button onClick={() => navigate('/events')} className="mt-4">
            Zurück zu Events
          </Button>
        </div>
      </AppLayout>
    );
  }

  const startsAt = new Date(event.starts_at);
  const endsAt = event.ends_at ? new Date(event.ends_at) : null;
  const isToday = new Date().toDateString() === startsAt.toDateString();
  const isSoon = startsAt.getTime() - Date.now() < 3 * 60 * 60 * 1000;
  const isCreator = profile?.id === event.creator_id;

  const goingCount = attendees?.goingCount || 0;
  const expectedAttendees = event.expected_attendees || 100;
  const fillPercentage = Math.min((goingCount / expectedAttendees) * 100, 100);

  const handleRSVP = async (status: 'going' | 'interested' | null) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await rsvpMutation.mutateAsync({ eventId: event.id, status });
      
      if (status === 'going') {
        toast({
          title: '✅ Zusage bestätigt!',
          description: `Du gehst zu "${event.name}" 🎉`,
        });
      } else if (status === null) {
        toast({
          title: 'Zusage zurückgezogen',
          description: 'Du wurdest von der Liste entfernt.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Aktion konnte nicht ausgeführt werden.',
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.name,
        text: `Check out ${event.name} at ${event.location_name}!`,
        url: window.location.href,
      });
    } catch {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link kopiert!', description: 'Event-Link in Zwischenablage.' });
    }
  };

  const isGoing = userRSVP?.status === 'going';
  const isInterested = userRSVP?.status === 'interested';

  return (
    <AppLayout hideNav>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
          {isCreator && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAttendeeManager(true)}
                className="gap-1.5 relative"
              >
                <Users className="h-4 w-4" />
                Gäste
                {pendingAttendees && pendingAttendees.length > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px] bg-red-500 animate-pulse">
                    {pendingAttendees.length}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/events/${id}/edit`)}>
                Bearbeiten
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Event löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Das Event "{event.name}" wird unwiderruflich gelöscht. Alle Zusagen und Nachrichten gehen verloren.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteEvent}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </header>

      {/* Attendee Manager for Host */}
      {isCreator && (
        <AttendeeManager
          open={showAttendeeManager}
          onOpenChange={setShowAttendeeManager}
          eventId={event?.id || ''}
          eventName={event?.name || ''}
          eventAddress={`${event?.address}, ${event?.city}`}
        />
      )}

      <div className="pb-24">
        {/* Cover Image */}
        <div className="relative aspect-video bg-muted">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-7xl">{categoryEmojis[event.category] || '🎉'}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            {isSoon && (
              <Badge className="bg-accent/90 backdrop-blur">
                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                {isToday ? 'Heute' : 'Bald'}
              </Badge>
            )}
            <Badge variant="outline" className="border-white/30 bg-background/60 backdrop-blur">
              {categoryEmojis[event.category]} {event.category.replace('_', ' ')}
            </Badge>
          </div>

          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur text-lg px-3 py-1">
              {event.is_free ? 'Kostenlos' : `${event.entry_price}€`}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Title & Creator */}
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {event.name}
            </h1>
            {event.creator && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={event.creator.avatar_url || ''} />
                  <AvatarFallback>{event.creator.display_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm text-muted-foreground">von </span>
                  <span className="text-sm font-medium text-foreground">
                    @{event.creator.username}
                  </span>
                  {event.creator.is_verified && (
                    <CheckCircle2 className="ml-1 inline h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Attendees Preview */}
          <Sheet open={showAttendees} onOpenChange={setShowAttendees}>
            <SheetTrigger asChild>
              <button className="w-full rounded-2xl border border-border/50 bg-card p-4 text-left transition hover:border-primary/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      {goingCount}/{expectedAttendees} zugesagt
                    </span>
                    {fillPercentage > 70 && (
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                        <Flame className="mr-1 h-3 w-3" />
                        Wird voll!
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-primary">{Math.round(fillPercentage)}%</span>
                </div>
                <Progress value={fillPercentage} className="h-2 mb-3" />
                
                {/* Friends attending */}
                {friendsAttending && friendsAttending.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {friendsAttending.slice(0, 4).map((friend) => (
                        <Avatar key={friend.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={friend.profile?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {friend.profile?.display_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {friendsAttending.length} Freunde gehen
                    </span>
                  </div>
                )}

                {/* All attendees preview */}
                {attendees && attendees.going.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-2">
                      {attendees.going.slice(0, 6).map((attendee: any) => (
                        <Avatar key={attendee.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={attendee.profile?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {attendee.profile?.display_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {attendees.going.length > 6 ? `+${attendees.going.length - 6} weitere` : ''}
                    </span>
                  </div>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Zusagen ({goingCount})</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 overflow-y-auto">
                {attendees?.going.map((attendee: any) => (
                  <div key={attendee.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={attendee.profile?.avatar_url || ''} />
                      <AvatarFallback>{attendee.profile?.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{attendee.profile?.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{attendee.profile?.username}</p>
                    </div>
                    <UserCheck className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Event Details */}
          <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{event.location_name}</p>
                <p className="text-sm text-muted-foreground">{event.address}, {event.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="font-medium">
                {format(startsAt, 'EEEE, d. MMMM yyyy', { locale: de })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <p className="font-medium">
                {format(startsAt, 'HH:mm')} Uhr
                {endsAt && ` – ${format(endsAt, 'HH:mm')} Uhr`}
              </p>
            </div>

            {!event.is_free && (
              <div className="flex items-center gap-3">
                <Euro className="h-5 w-5 text-primary" />
                <p className="font-medium">{event.entry_price}€ Eintritt</p>
              </div>
            )}

            {event.dresscode && (
              <div className="flex items-center gap-3">
                <Shirt className="h-5 w-5 text-primary" />
                <p className="font-medium">{event.dresscode}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <h3 className="font-semibold mb-2">Beschreibung</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Dos & Don'ts */}
          {event.dos_and_donts && (
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <h3 className="font-semibold mb-2">Dos & Don'ts</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.dos_and_donts}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="gap-2" onClick={() => {
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address + ', ' + event.city)}`);
            }}>
              <Navigation className="h-4 w-4" />
              Navigation
            </Button>
            <Button variant="outline" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Kalender
            </Button>
          </div>

        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-lg flex gap-3">
          {isGoing ? (
            <>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-green-500 text-green-500"
                onClick={() => handleRSVP(null)}
              >
                <CheckCircle2 className="h-5 w-5" />
                Du gehst hin
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleRSVP('going')}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent"
                disabled={rsvpMutation.isPending}
              >
                <UserCheck className="h-5 w-5" />
                Zusagen
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRSVP('interested')}
                className={cn(isInterested && 'border-yellow-500 text-yellow-500')}
                disabled={rsvpMutation.isPending}
              >
                {isInterested ? 'Interessiert' : 'Vielleicht'}
              </Button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
