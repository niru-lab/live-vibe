import { RsvpButtons } from '@/components/events/RsvpButtons';

/** Compact RSVP control used inside map popups — shares state with feed & detail. */
export const MapEventRsvp = ({ eventId }: { eventId: string }) => (
  <div className="mt-2">
    <RsvpButtons eventId={eventId} surface="map" compact />
  </div>
);
