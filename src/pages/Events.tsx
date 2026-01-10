import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEvents, useMyEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calendar, PartyPopper } from 'lucide-react';

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: upcomingEvents, isLoading: upcomingLoading } = useEvents();
  const { data: myEvents, isLoading: myEventsLoading } = useMyEvents();

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">Events</h1>
          </div>
          <Button
            onClick={() => navigate('/events/create')}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-primary to-accent"
          >
            <Plus className="h-4 w-4" />
            Erstellen
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="upcoming" className="flex-1">
              Anstehend
            </TabsTrigger>
            <TabsTrigger value="my-events" className="flex-1">
              Meine Events
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="upcoming" className="mt-0">
            {upcomingLoading ? (
              <EventsSkeleton />
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => navigate(`/events/${event.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Keine Events"
                description="Es gibt noch keine anstehenden Events. Sei der Erste!"
                onAction={() => navigate('/events/create')}
                actionLabel="Event erstellen"
              />
            )}
          </TabsContent>

          <TabsContent value="my-events" className="mt-0">
            {!user ? (
              <EmptyState
                title="Nicht angemeldet"
                description="Melde dich an, um deine Events zu sehen."
                onAction={() => navigate('/auth')}
                actionLabel="Anmelden"
              />
            ) : myEventsLoading ? (
              <EventsSkeleton />
            ) : myEvents && myEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {myEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={{ ...event, creator: null }}
                    onClick={() => navigate(`/events/${event.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Keine eigenen Events"
                description="Du hast noch keine Events erstellt."
                onAction={() => navigate('/events/create')}
                actionLabel="Erstes Event erstellen"
              />
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
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  onAction: () => void;
  actionLabel: string;
}

function EmptyState({ title, description, onAction, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <PartyPopper className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mb-6 max-w-xs text-muted-foreground">{description}</p>
      <Button onClick={onAction} className="bg-gradient-to-r from-primary to-accent">
        {actionLabel}
      </Button>
    </div>
  );
}
