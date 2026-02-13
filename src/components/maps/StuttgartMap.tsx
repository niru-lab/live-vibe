import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEvents, useVenues } from '@/hooks/useEvents';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Location {
  id?: string;
  name: string;
  address: string;
  category: 'bar' | 'club' | 'cafe' | 'event' | 'restaurant' | 'other';
  coordinates: [number, number];
  areaKey?: string;
  postCount?: number;
  eventData?: {
    id: string;
    starts_at: string;
    expected_attendees?: number;
  };
}

// Stuttgart area coordinates for events without exact lat/lng
const stuttgartAreas: Record<string, [number, number]> = {
  'stuttgart': [48.7758, 9.1829],
  'mitte': [48.7758, 9.1829],
  'stuttgart mitte': [48.7758, 9.1829],
  'west': [48.7720, 9.1550],
  'stuttgart west': [48.7720, 9.1550],
  'ost': [48.7850, 9.2100],
  'stuttgart ost': [48.7850, 9.2100],
  'süd': [48.7550, 9.1750],
  'stuttgart süd': [48.7550, 9.1750],
  'nord': [48.8050, 9.1800],
  'stuttgart nord': [48.8050, 9.1800],
  'bad cannstatt': [48.8060, 9.2150],
  'cannstatt': [48.8060, 9.2150],
  'vaihingen': [48.7300, 9.1050],
  'stuttgart vaihingen': [48.7300, 9.1050],
  'degerloch': [48.7450, 9.1700],
  'stuttgart degerloch': [48.7450, 9.1700],
  'feuerbach': [48.8100, 9.1550],
  'stuttgart feuerbach': [48.8100, 9.1550],
  'zuffenhausen': [48.8350, 9.1700],
  'stuttgart zuffenhausen': [48.8350, 9.1700],
  'untertürkheim': [48.7750, 9.2450],
  'stuttgart untertürkheim': [48.7750, 9.2450],
  'heslach': [48.7580, 9.1650],
  'stuttgart heslach': [48.7580, 9.1650],
  'killesberg': [48.8000, 9.1680],
  'botnang': [48.7850, 9.1380],
  'weilimdorf': [48.8150, 9.1100],
  'möhringen': [48.7250, 9.1500],
  'sillenbuch': [48.7450, 9.2150],
  'plieningen': [48.7100, 9.2050],
  'stammheim': [48.8400, 9.1500],
  'mühlhausen': [48.8350, 9.2100],
  'wangen': [48.7700, 9.2350],
  'hedelfingen': [48.7650, 9.2500],
  'obertürkheim': [48.7600, 9.2550],
  'rotenberg': [48.7850, 9.2450],
  // Other cities
  'berlin': [52.5200, 13.4050],
  'berlin mitte': [52.5200, 13.4050],
  'hamburg': [53.5511, 9.9937],
  'münchen': [48.1351, 11.5820],
  'köln': [50.9375, 6.9603],
  'frankfurt': [50.1109, 8.6821],
  'düsseldorf': [51.2277, 6.7735],
  'leipzig': [51.3397, 12.3731],
  'dortmund': [51.5136, 7.4653],
  'essen': [51.4556, 7.0116],
  'bremen': [53.0793, 8.8017],
  'dresden': [51.0504, 13.7373],
};

// Get coordinates for an event based on city and area
const getEventCoordinates = (city: string, area: string): [number, number] | null => {
  const areaLower = area?.toLowerCase().trim() || '';
  const cityLower = city?.toLowerCase().trim() || '';
  
  // First try exact area match
  if (stuttgartAreas[areaLower]) {
    return stuttgartAreas[areaLower];
  }
  
  // Try with city prefix
  const withCity = `${cityLower} ${areaLower}`;
  if (stuttgartAreas[withCity]) {
    return stuttgartAreas[withCity];
  }
  
  // Try city alone
  if (stuttgartAreas[cityLower]) {
    return stuttgartAreas[cityLower];
  }
  
  // Default to Stuttgart center if it's a Stuttgart event
  if (cityLower.includes('stuttgart')) {
    return stuttgartAreas['stuttgart'];
  }
  
  return null;
};

const categoryColors: Record<string, string> = {
  bar: '#f97316',
  club: '#a855f7',
  cafe: '#22c55e',
  event: '#ef4444',
};

const categoryLabels: Record<string, string> = {
  bar: '🍸 Bar',
  club: '🎧 Club',
  cafe: '☕ Café',
  event: '🎉 Events',
};

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom marker icons for each category with dynamic size
const createCustomIcon = (color: string, isHot = false, count = 1) => {
  // Scale size based on count (min 24px, max 56px for hot venues/events)
  const baseSize = isHot ? 28 : 24;
  const maxSize = 56;
  const size = isHot ? Math.min(baseSize + (count - 1) * 8, maxSize) : baseSize;
  const halfSize = size / 2;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${color};
      border: ${isHot ? '3px' : '2px'} solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3), ${isHot && count > 0 ? `0 0 ${Math.max(count * 5, 10)}px ${color}` : 'none'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: ${Math.max(10, size / 3)}px;
      ${isHot ? 'animation: pulse 2s ease-in-out infinite;' : ''}
    ">${count > 0 ? count : ''}</div>
    ${isHot ? `<style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 ${color}80; }
        50% { transform: scale(1.05); box-shadow: 0 0 ${10 + count * 3}px ${count * 2}px ${color}40; }
      }
    </style>` : ''}`,
    iconSize: [size, size],
    iconAnchor: [halfSize, halfSize],
    popupAnchor: [0, -halfSize],
  });
};

const categoryIcons: Record<string, L.DivIcon> = {
  bar: createCustomIcon(categoryColors.bar),
  club: createCustomIcon(categoryColors.club),
  cafe: createCustomIcon(categoryColors.cafe),
  event: createCustomIcon(categoryColors.event, true),
};

export function StuttgartMap() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: events } = useEvents();
  const { data: venues } = useVenues();
  const navigate = useNavigate();

  // Fetch posts per venue with media info
  const { data: venuePosts } = useQuery({
    queryKey: ['venue-posts-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          venue_id,
          media_url,
          media_type,
          caption,
          created_at,
          author:profiles!posts_author_id_fkey(username, avatar_url)
        `)
        .not('venue_id', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group posts by venue
      const postsByVenue: Record<string, typeof data> = {};
      data?.forEach(post => {
        if (post.venue_id) {
          if (!postsByVenue[post.venue_id]) {
            postsByVenue[post.venue_id] = [];
          }
          postsByVenue[post.venue_id].push(post);
        }
      });
      return postsByVenue;
    },
  });

  // Get post count per venue
  const venuePostCounts = Object.fromEntries(
    Object.entries(venuePosts || {}).map(([venueId, posts]) => [venueId, posts?.length || 0])
  );

  // Convert venues from database to Location format with post counts
  const venueLocations: Location[] = (venues || []).map(venue => ({
    id: venue.id,
    name: venue.name,
    address: venue.address,
    category: venue.category as Location['category'],
    coordinates: [venue.latitude, venue.longitude] as [number, number],
    postCount: venuePostCounts?.[venue.id] || 0,
  }));

  // Group events by area for heatmap effect
  const eventsByArea = (events || []).reduce((acc, event) => {
    const areaKey = `${event.address?.toLowerCase().trim()}-${event.city?.toLowerCase().trim()}`;
    if (!acc[areaKey]) {
      acc[areaKey] = [];
    }
    acc[areaKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  // Create grouped event locations with count
  interface GroupedLocation extends Location {
    eventCount: number;
    allEvents: Array<{
      id: string;
      name: string;
      starts_at: string;
      expected_attendees?: number;
    }>;
  }

  const groupedEventLocations: GroupedLocation[] = Object.entries(eventsByArea)
    .map(([areaKey, areaEvents]) => {
      if (!areaEvents || areaEvents.length === 0) return null;
      
      const firstEvent = areaEvents[0];
      let coords: [number, number] | null = null;
      
      // First try exact coordinates from first event
      if (firstEvent.latitude && firstEvent.longitude) {
        coords = [firstEvent.latitude, firstEvent.longitude];
      } else {
        // Try to get coordinates from area/city
        coords = getEventCoordinates(firstEvent.city, firstEvent.address);
      }
      
      if (!coords) return null;
      
      return {
        id: firstEvent.id,
        name: areaEvents.length > 1 
          ? `${areaEvents.length} Events in ${firstEvent.address}` 
          : firstEvent.name,
        address: `${firstEvent.address}, ${firstEvent.city}`,
        category: 'event' as const,
        coordinates: coords,
        areaKey,
        eventCount: areaEvents.length,
        allEvents: areaEvents.map(e => ({
          id: e.id,
          name: e.name,
          starts_at: e.starts_at,
          expected_attendees: e.expected_attendees || undefined,
        })),
        eventData: {
          id: firstEvent.id,
          starts_at: firstEvent.starts_at,
          expected_attendees: firstEvent.expected_attendees || undefined,
        },
      };
    })
    .filter((loc): loc is NonNullable<typeof loc> => loc !== null);

  // Combine venue locations from DB with grouped events
  const allLocations = [...venueLocations, ...groupedEventLocations];

  const filteredLocations = selectedCategory
    ? allLocations.filter(l => l.category === selectedCategory)
    : allLocations;

  const getCategoryCount = (category: string) => {
    if (category === 'event') {
      return (events || []).length;
    }
    return venueLocations.filter(l => l.category === category).length;
  };

  // Get dynamic icon for location based on activity (posts or events)
  const getLocationIcon = (location: Location | GroupedLocation) => {
    const color = categoryColors[location.category] || categoryColors.bar;
    
    if (location.category === 'event') {
      const count = 'eventCount' in location ? location.eventCount : 1;
      return createCustomIcon(color, true, count);
    }
    
    // For venues, show post count
    const postCount = location.postCount || 0;
    if (postCount > 0) {
      return createCustomIcon(color, true, postCount);
    }
    
    return createCustomIcon(color, false, 0);
  };

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border/50">
      <MapContainer
        center={[48.7758, 9.1829]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredLocations.map((location, index) => {
          const isGrouped = 'allEvents' in location;
          const eventCount = isGrouped ? (location as any).eventCount : 1;
          const allEvents = isGrouped ? (location as any).allEvents : location.eventData ? [location.eventData] : [];
          const postCount = location.postCount || 0;
          
          return (
            <Marker
              key={`${location.name}-${index}`}
              position={location.coordinates}
              icon={getLocationIcon(location)}
            >
              <Popup>
                <div className="p-1 min-w-[240px] max-h-[350px] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span 
                      className="text-white px-2 py-0.5 rounded-full text-xs inline-block"
                      style={{ backgroundColor: categoryColors[location.category] }}
                    >
                      {categoryLabels[location.category]}
                    </span>
                    {location.category === 'event' && eventCount > 1 && (
                      <span className="text-xs font-bold text-red-500">
                        🔥 {eventCount} Events
                      </span>
                    )}
                    {location.category !== 'event' && postCount > 0 && (
                      <span className="text-xs font-bold text-purple-500 flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        {postCount} {postCount === 1 ? 'Post' : 'Posts'}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold mb-1 text-gray-900 text-sm">{location.name}</h3>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {location.address}
                  </p>
                  
                  {/* Posts Preview for Venues */}
                  {location.category !== 'event' && location.id && venuePosts?.[location.id] && venuePosts[location.id].length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">📸 Neueste Posts</p>
                      <div className="grid grid-cols-3 gap-1">
                        {venuePosts[location.id].slice(0, 6).map((post: any) => (
                          <div 
                            key={post.id} 
                            className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
                            onClick={() => navigate(`/feed`)}
                          >
                            {post.media_type === 'video' ? (
                              <video 
                                src={post.media_url} 
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img 
                                src={post.media_url} 
                                alt={post.caption || 'Post'} 
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs">
                                👁️
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {venuePosts[location.id].length > 6 && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          +{venuePosts[location.id].length - 6} weitere
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Events */}
                  {location.category === 'event' && allEvents.length > 0 && (
                    <div className="space-y-3 mb-2">
                      {allEvents.slice(0, 5).map((evt: any, i: number) => (
                        <div key={evt.id} className={`${i > 0 ? 'pt-2 border-t border-gray-200' : ''}`}>
                          {eventCount > 1 && (
                            <p className="text-xs font-semibold text-gray-800 mb-1">{evt.name}</p>
                          )}
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(evt.starts_at), 'dd. MMM, HH:mm', { locale: de })} Uhr
                          </p>
                          {evt.expected_attendees && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              ~{evt.expected_attendees} erwartet
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="w-full mt-2 bg-gradient-neon text-white text-xs"
                            onClick={() => navigate(`/events/${evt.id}`)}
                          >
                            {eventCount > 1 ? 'Ansehen' : 'Event ansehen'}
                          </Button>
                        </div>
                      ))}
                      {allEvents.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{allEvents.length - 5} weitere Events
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-xl p-3 z-[10]">
        <div className="text-xs font-semibold mb-2 text-foreground">Stuttgart Locations</div>
        <div className="flex flex-col gap-1.5">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-all ${
                selectedCategory === key 
                  ? 'bg-primary/20 neon-glow-sm' 
                  : 'hover:bg-muted'
              }`}
            >
              <div 
                className={`w-3 h-3 rounded-full ${key === 'event' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: categoryColors[key] }}
              />
              <span className="text-foreground">{label}</span>
              <span className="text-muted-foreground ml-auto">
                {getCategoryCount(key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent z-[999]" />
    </div>
  );
}
