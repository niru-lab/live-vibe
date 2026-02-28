import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEvents, useVenues } from '@/hooks/useEvents';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmV5cm4iLCJhIjoiY21tNjZrYm5xMGRwMTJwcnp5bmhwbGU2aSJ9.qvMwkRPWhHDXQYrsYpN2Yw';

// feyrn dark map style
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

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
  'degerloch': [48.7450, 9.1700],
  'feuerbach': [48.8100, 9.1550],
  'zuffenhausen': [48.8350, 9.1700],
  'untertürkheim': [48.7750, 9.2450],
  'heslach': [48.7580, 9.1650],
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
  'aalen': [48.8375, 10.0933],
  'wasseralfingen': [48.8580, 10.0760],
  'frankfurt': [50.1109, 8.6821],
  'frankfurt am main': [50.1109, 8.6821],
  'sachsenhausen': [50.1000, 8.6850],
  'bornheim': [50.1200, 8.7100],
  'bockenheim': [50.1200, 8.6350],
  'nordend': [50.1250, 8.6900],
  'westend': [50.1200, 8.6600],
  'bahnhofsviertel': [50.1070, 8.6650],
  'altstadt': [50.1109, 8.6821],
  'berlin': [52.5200, 13.4050],
  'hamburg': [53.5511, 9.9937],
  'münchen': [48.1351, 11.5820],
  'köln': [50.9375, 6.9603],
};

const getEventCoordinates = (city: string, area: string): [number, number] | null => {
  const areaLower = area?.toLowerCase().trim() || '';
  const cityLower = city?.toLowerCase().trim() || '';
  if (stuttgartAreas[areaLower]) return stuttgartAreas[areaLower];
  const withCity = `${cityLower} ${areaLower}`;
  if (stuttgartAreas[withCity]) return stuttgartAreas[withCity];
  if (stuttgartAreas[cityLower]) return stuttgartAreas[cityLower];
  if (cityLower.includes('stuttgart')) return stuttgartAreas['stuttgart'];
  return null;
};

const categoryColors: Record<string, string> = {
  bar: '#f97316',
  club: '#a855f7',
  cafe: '#22c55e',
  event: '#ef4444',
  restaurant: '#3b82f6',
  other: '#6b7280',
};

const categoryLabels: Record<string, string> = {
  bar: '🍸 Bar',
  club: '🎧 Club',
  cafe: '☕ Café',
  event: '🎉 Events',
};

const cityCenters: Record<string, { center: [number, number]; zoom: number }> = {
  'Stuttgart': { center: [48.7758, 9.1829], zoom: 13 },
  'Aalen (BW)': { center: [48.8375, 10.0933], zoom: 13 },
  'Frankfurt am Main': { center: [50.1109, 8.6821], zoom: 12.5 },
};

// Heatmap layer style
const heatmapLayer: any = {
  id: 'events-heat',
  type: 'heatmap',
  source: 'events-heatmap',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 10, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.1, 'rgba(103,0,255,0.15)',
      0.3, 'rgba(147,51,234,0.3)',
      0.5, 'rgba(168,85,247,0.45)',
      0.7, 'rgba(236,72,153,0.6)',
      0.9, 'rgba(239,68,68,0.75)',
      1, 'rgba(255,255,255,0.9)',
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 15, 30],
    'heatmap-opacity': 0.8,
  },
};

interface StuttgartMapProps {
  selectedCity?: string | null;
}

export function StuttgartMap({ selectedCity }: StuttgartMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const { data: events } = useEvents();
  const { data: venues } = useVenues();
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);

  // Fetch posts per venue
  const { data: venuePosts } = useQuery({
    queryKey: ['venue-posts-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`id, venue_id, media_url, media_type, caption, created_at, author:profiles!posts_author_id_fkey(username, avatar_url)`)
        .not('venue_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const postsByVenue: Record<string, typeof data> = {};
      data?.forEach(post => {
        if (post.venue_id) {
          if (!postsByVenue[post.venue_id]) postsByVenue[post.venue_id] = [];
          postsByVenue[post.venue_id].push(post);
        }
      });
      return postsByVenue;
    },
  });

  // Fly to city when filter changes
  useEffect(() => {
    if (!mapRef.current) return;
    const target = selectedCity && cityCenters[selectedCity]
      ? cityCenters[selectedCity]
      : { center: [48.7758, 9.1829] as [number, number], zoom: 13 };
    mapRef.current.flyTo({
      center: [target.center[1], target.center[0]],
      zoom: target.zoom,
      duration: 1500,
    });
  }, [selectedCity]);

  // Build heatmap GeoJSON from events
  const heatmapData = useMemo(() => {
    const features = (events || [])
      .map(event => {
        let coords: [number, number] | null = null;
        if (event.latitude && event.longitude) {
          coords = [event.latitude, event.longitude];
        } else {
          coords = getEventCoordinates(event.city, event.address);
        }
        if (!coords) return null;

        // Filter by city
        if (selectedCity && selectedCity !== 'Alle' && event.city?.toLowerCase() !== selectedCity.toLowerCase()) return null;

        return {
          type: 'Feature' as const,
          properties: {
            intensity: (event.expected_attendees || 50) / 50,
            name: event.name,
            id: event.id,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [coords[1], coords[0]], // [lng, lat]
          },
        };
      })
      .filter(Boolean);

    return { type: 'FeatureCollection' as const, features };
  }, [events, selectedCity]);

  // Build venue markers
  const venueMarkers = useMemo(() => {
    const filtered = (venues || []).filter(v => {
      if (selectedCity && selectedCity !== 'Alle' && v.city?.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (selectedCategory && selectedCategory !== 'event' && v.category !== selectedCategory) return false;
      if (selectedCategory === 'event') return false;
      return true;
    });
    return filtered;
  }, [venues, selectedCity, selectedCategory]);

  // Build event markers (for popup interaction)
  const eventMarkers = useMemo(() => {
    if (selectedCategory && selectedCategory !== 'event') return [];
    return (events || [])
      .map(event => {
        let coords: [number, number] | null = null;
        if (event.latitude && event.longitude) coords = [event.latitude, event.longitude];
        else coords = getEventCoordinates(event.city, event.address);
        if (!coords) return null;
        if (selectedCity && selectedCity !== 'Alle' && event.city?.toLowerCase() !== selectedCity.toLowerCase()) return null;
        return { ...event, coords };
      })
      .filter(Boolean) as (typeof events extends (infer T)[] | undefined ? T & { coords: [number, number] } : never)[];
  }, [events, selectedCity, selectedCategory]);

  const getCategoryCount = useCallback((category: string) => {
    const cityFilter = (city?: string | null) =>
      !selectedCity || selectedCity === 'Alle' || city?.toLowerCase() === selectedCity?.toLowerCase();
    if (category === 'event') return (events || []).filter(e => cityFilter(e.city)).length;
    return (venues || []).filter(v => v.category === category && cityFilter(v.city)).length;
  }, [events, venues, selectedCity]);

  const postCount = (venueId: string) => venuePosts?.[venueId]?.length || 0;

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border/50">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 48.7758,
          longitude: 9.1829,
          zoom: 13,
          pitch: 45,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Heatmap Layer */}
        {(!selectedCategory || selectedCategory === 'event') && (
          <Source id="events-heatmap" type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {/* Venue Markers */}
        {venueMarkers.map(venue => {
          const count = postCount(venue.id);
          const color = categoryColors[venue.category] || categoryColors.other;
          const size = count > 0 ? Math.min(16 + count * 3, 32) : 14;
          return (
            <Marker
              key={venue.id}
              latitude={venue.latitude}
              longitude={venue.longitude}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setPopupInfo({ type: 'venue', data: venue });
              }}
            >
              <div
                className="rounded-full border-2 border-white/80 cursor-pointer transition-transform hover:scale-125 flex items-center justify-center"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  boxShadow: count > 0 ? `0 0 ${count * 4}px ${color}` : '0 2px 6px rgba(0,0,0,0.4)',
                }}
              >
                {count > 0 && (
                  <span className="text-white font-bold" style={{ fontSize: Math.max(8, size / 3) }}>
                    {count}
                  </span>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Event Markers */}
        {eventMarkers.map(event => {
          const size = Math.min(14 + (event.expected_attendees || 0) / 20, 30);
          return (
            <Marker
              key={event.id}
              latitude={event.coords[0]}
              longitude={event.coords[1]}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setPopupInfo({ type: 'event', data: event });
              }}
            >
              <div
                className="rounded-full border-2 border-white/80 cursor-pointer animate-pulse"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: categoryColors.event,
                  boxShadow: `0 0 12px ${categoryColors.event}`,
                }}
              />
            </Marker>
          );
        })}

        {/* Popup */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.type === 'venue' ? popupInfo.data.latitude : popupInfo.data.coords[0]}
            longitude={popupInfo.type === 'venue' ? popupInfo.data.longitude : popupInfo.data.coords[1]}
            onClose={() => setPopupInfo(null)}
            closeOnClick={true}
            closeButton={true}
            maxWidth="280px"
            className="feyrn-popup"
          >
            <div className="p-1 min-w-[240px]">
              {popupInfo.type === 'venue' && (
                <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-white px-2 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: categoryColors[popupInfo.data.category] }}
                    >
                      {categoryLabels[popupInfo.data.category] || popupInfo.data.category}
                    </span>
                    {postCount(popupInfo.data.id) > 0 && (
                      <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                        <Image className="h-3 w-3" />
                        {postCount(popupInfo.data.id)} Posts
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold mb-1 text-sm text-white">{popupInfo.data.name}</h3>
                  <p className="text-xs text-neutral-400 mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {popupInfo.data.address}
                  </p>
                  {/* Post previews */}
                  {venuePosts?.[popupInfo.data.id] && venuePosts[popupInfo.data.id].length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold mb-1">📸 Neueste Posts</p>
                      <div className="grid grid-cols-3 gap-1">
                        {venuePosts[popupInfo.data.id].slice(0, 6).map((post: any) => (
                          <div
                            key={post.id}
                            className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
                            onClick={() => navigate('/feed')}
                          >
                            {post.media_type === 'video' ? (
                              <video src={post.media_url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={post.media_url} alt={post.caption || 'Post'} className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {popupInfo.type === 'event' && (
                <>
                  <span
                    className="text-white px-2 py-0.5 rounded-full text-xs inline-block mb-2"
                    style={{ backgroundColor: categoryColors.event }}
                  >
                    🎉 Event
                  </span>
                  <h3 className="font-bold mb-1 text-sm text-white">{popupInfo.data.name}</h3>
                  <p className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {popupInfo.data.address}, {popupInfo.data.city}
                  </p>
                  <p className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(popupInfo.data.starts_at), 'dd. MMM, HH:mm', { locale: de })} Uhr
                  </p>
                  {popupInfo.data.expected_attendees && (
                    <p className="text-xs text-neutral-400 mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      ~{popupInfo.data.expected_attendees} erwartet
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="w-full mt-1 bg-gradient-neon text-white text-xs"
                    onClick={() => navigate(`/events/${popupInfo.data.id}`)}
                  >
                    Event ansehen
                  </Button>
                </>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-xl p-3 z-10">
        <div className="text-xs font-semibold mb-2 text-foreground">
          {selectedCity && selectedCity !== 'Alle' ? `${selectedCity}` : 'Alle Locations'}
        </div>
        <div className="flex flex-col gap-1.5">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-all ${
                selectedCategory === key ? 'bg-primary/20 neon-glow-sm' : 'hover:bg-muted'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${key === 'event' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: categoryColors[key] }}
              />
              <span className="text-foreground">{label}</span>
              <span className="text-muted-foreground ml-auto">{getCategoryCount(key)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
