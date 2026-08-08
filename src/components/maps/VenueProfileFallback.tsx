import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Storefront, WarningCircle, WifiSlash, Lock } from '@phosphor-icons/react';
import type { VenueProfileState } from '@/hooks/useVenueSheet';

interface VenueProfileFallbackProps {
  state: Exclude<VenueProfileState, 'found'>;
  hasEvent?: boolean;
  hasPosts?: boolean;
  onBackToEvent?: () => void;
  onViewPosts?: () => void;
  onRetry?: () => void;
}

/**
 * Inline empty/error states for a venue without a real profile row.
 * Never navigates away and never renders placeholder venue data.
 */
export const VenueProfileFallback = ({
  state,
  hasEvent,
  hasPosts,
  onBackToEvent,
  onViewPosts,
  onRetry,
}: VenueProfileFallbackProps) => {
  if (state === 'loading') {
    return (
      <div className="space-y-3 py-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <div className="py-10 text-center">
        <Lock weight="thin" className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Profil nicht verfügbar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Du hast keine Berechtigung, dieses Venue-Profil zu sehen.
        </p>
        {onBackToEvent && (
          <Button variant="outline" className="mt-4 min-h-[44px]" onClick={onBackToEvent}>
            Zurück zum Event
          </Button>
        )}
      </div>
    );
  }

  if (state === 'network_error' || state === 'error') {
    const Icon = state === 'network_error' ? WifiSlash : WarningCircle;
    return (
      <div className="py-10 text-center">
        <Icon weight="thin" className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">
          {state === 'network_error' ? 'Keine Verbindung' : 'Etwas ist schiefgelaufen'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Das Venue-Profil konnte nicht geladen werden.
        </p>
        {onRetry && (
          <Button variant="outline" className="mt-4 min-h-[44px]" onClick={onRetry}>
            Erneut versuchen
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="py-10 text-center">
      <Storefront weight="thin" className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">Kein Venue-Profil vorhanden</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Für diesen Spot wurde noch kein Venue-Profil erstellt.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Events und öffentliche Live-Posts können trotzdem sichtbar sein.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {hasEvent && onBackToEvent && (
          <Button variant="outline" className="min-h-[44px]" onClick={onBackToEvent}>
            Zurück zum Event
          </Button>
        )}
        {hasPosts && onViewPosts && (
          <Button variant="outline" className="min-h-[44px]" onClick={onViewPosts}>
            Live Posts ansehen
          </Button>
        )}
      </div>
    </div>
  );
};
