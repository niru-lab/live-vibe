import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents, useMyEvents } from '@/hooks/useEvents';
import { useMyRSVPs, useMyInvitations, useRespondToInvitation } from '@/hooks/useEventAttendees';
import { useAuth } from '@/contexts/AuthContext';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Confetti, UserCheck, ChartBar, Eye, ShareNetwork, Envelope, Check, X } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: upcomingEvents, isLoading: upcomingLoading } = useEvents();
  const { data: myEvents, isLoading: myEventsLoading } = useMyEvents();
  const { data: myRSVPs, isLoading: rsvpsLoading } = useMyRSVPs();
  const { data: invitations = [], isLoading: invitationsLoading } = useMyInvitations();
  const respondToInvite = useRespondToInvitation();

  const handleInviteResponse = (attendeeId: string, accept: boolean) => {
    respondToInvite.mutate(
      { attendeeId, accept },
      { onSuccess: () => { toast.success(accept ? 'Einladung angenommen! 🎉' : 'Einladung abgelehnt'); } }
    );
  };

  return (
    <AppLayout>
      <div className="fixed inset-0 bg-gradient-hero -z-10" />
      
      <header className="sticky top-0 z-40 glass">
        <div className="flex items-center justify-between p-4">
          <span className="text-2xl">🎉</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChartBar weight="thin" className="h-5 w-5 text-muted-foreground drop-shadow-[0_0_6px_hsl(var(--neon-purple))]" />
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
          <TabsList className="w-full glass rounded-2xl p-1">
            <TabsTrigger value="upcoming" className="flex-1 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white">
              Anstehend
              {invitations.length > 0 && (
                <Badge className="ml-1.5 h-5 w-5 rounded-full bg-destructive p-0 text-xs text-destructive-foreground">{invitations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-rsvps" className="flex-1 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white">Zusagen</TabsTrigger>
            <TabsTrigger value="my-events" className="flex-1 rounded-xl data-[state=active]:bg-gradient-neon data-[state=active]:text-white">Meine</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="upcoming" className="mt-0 space-y-4">
            {invitations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Envelope weight="thin" className="h-4 w-4" />
                  Einladungen ({invitations.length})
                </div>
                {invitations.map((invite: any) => (
                  <div key={invite.id} className="rounded-xl border-2 border-primary/30 bg-card p-4 transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                        {invite.event?.cover_image_url ? (
                          <img src={invite.event.cover_image_url} alt="" className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-xl">🎉</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{invite.event?.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {invite.event?.starts_at && format(new Date(invite.event.starts_at), 'EEE, d. MMM • HH:mm', { locale: de })}
                        </p>
                        <p className="text-xs text-muted-foreground">von @{invite.event?.creator?.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1 bg-primary" onClick={() => handleInviteResponse(invite.id, true)} disabled={respondToInvite.isPending}>
                        <Check weight="thin" className="h-4 w-4" /> Annehmen
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleInviteResponse(invite.id, false)} disabled={respondToInvite.isPending}>
                        <X weight="thin" className="h-4 w-4" /> Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {upcomingLoading ? <EventsSkeleton /> : upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />
                ))}
              </div>
            ) : invitations.length === 0 ? (
              <EmptyState title="Keine Events" description="Es gibt noch keine anstehenden Events. Erstelle eins über das + unten." />
            ) : null}
          </TabsContent>

          <TabsContent value="my-rsvps" className="mt-0">
            {!user ? (
              <EmptyState title="Nicht angemeldet" description="Melde dich an, um deine Zusagen zu sehen." onAction={() => navigate('/auth')} actionLabel="Anmelden" />
            ) : rsvpsLoading ? <EventsSkeleton /> : myRSVPs && myRSVPs.length > 0 ? (
              <div className="space-y-3">
                {myRSVPs.map((rsvp: any) => (
                  <div key={rsvp.id} onClick={() => navigate(`/events/${rsvp.event.id}`)} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:border-primary/50 transition">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                      {rsvp.event.cover_image_url ? (
                        <img src={rsvp.event.cover_image_url} alt="" className="h-full w-full object-cover rounded-xl" />
                      ) : <span className="text-2xl">🎉</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{rsvp.event.name}</h3>
                      <p className="text-sm text-muted-foreground">{format(new Date(rsvp.event.starts_at), 'EEE, d. MMM • HH:mm', { locale: de })}</p>
                    </div>
                    <Badge variant={rsvp.status === 'going' ? 'default' : 'secondary'} className={rsvp.status === 'going' ? 'bg-green-500' : ''}>
                      <UserCheck weight="thin" className="mr-1 h-3 w-3" />
                      {rsvp.status === 'going' ? 'Zugesagt' : 'Interessiert'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Keine Zusagen" description="Du hast noch keinem Event zugesagt." onAction={() => setActiveTab('upcoming')} actionLabel="Events entdecken" />
            )}
          </TabsContent>

          <TabsContent value="my-events" className="mt-0">
            {!user ? (
              <EmptyState title="Nicht angemeldet" description="Melde dich an, um deine Events zu sehen." onAction={() => navigate('/auth')} actionLabel="Anmelden" />
            ) : myEventsLoading ? <EventsSkeleton /> : myEvents && myEvents.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ChartBar weight="thin" className="h-5 w-5 text-primary" /> Dein Event-Dashboard
                  </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                     <div className="rounded-xl bg-background/50 p-3"><p className="text-xl font-bold text-primary">{myEvents.length}</p><p className="text-xs text-muted-foreground">Events</p></div>
                     <div className="rounded-xl bg-background/50 p-3"><p className="text-xl font-bold text-accent">--</p><p className="text-xs text-muted-foreground">Zusagen</p></div>
                     <div className="rounded-xl bg-background/50 p-3"><p className="text-xl font-bold text-green-500">--</p><p className="text-xs text-muted-foreground">Views</p></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {myEvents.map((event) => (
                    <div key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:border-primary/50 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{event.name}</h3>
                          <p className="text-sm text-muted-foreground">{format(new Date(event.starts_at), 'EEE, d. MMM • HH:mm', { locale: de })}</p>
                        </div>
                        <Badge variant={event.is_active ? 'default' : 'secondary'}>{event.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><UserCheck weight="thin" className="h-4 w-4" /><span>-- zugesagt</span></div>
                        <div className="flex items-center gap-1"><Eye weight="thin" className="h-4 w-4" /><span>-- Views</span></div>
                        <div className="flex items-center gap-1"><ShareNetwork weight="thin" className="h-4 w-4" /><span>-- Shares</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Keine eigenen Events" description="Du hast noch keine Events erstellt." onAction={() => navigate('/events/create')} actionLabel="Erstes Event erstellen" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EventsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3"><Skeleton className="aspect-[16/9] w-full rounded-xl" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
      ))}
    </div>
  );
}

interface EmptyStateProps { title: string; description: string; onAction?: () => void; actionLabel?: string; }

function EmptyState({ title, description, onAction, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full glass">
        <Confetti weight="thin" className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground">{description}</p>
      {onAction && actionLabel && <Button onClick={onAction} variant="outline">{actionLabel}</Button>}
    </div>
  );
}
