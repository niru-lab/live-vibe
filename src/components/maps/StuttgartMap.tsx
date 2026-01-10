import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEvents } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Location {
  id?: string;
  name: string;
  address: string;
  category: 'bar' | 'club' | 'cafe' | 'event';
  coordinates: [number, number];
  eventData?: {
    id: string;
    starts_at: string;
    expected_attendees?: number;
  };
}

const stuttgartLocations: Location[] = [
  // Bars
  { name: 'Schwarz Weiß Bar', address: 'Wilhelmstraße 8A, 70182 Stuttgart', category: 'bar', coordinates: [48.7738, 9.1850] },
  { name: 'anderthalb Bar', address: 'Königstraße 47, 70173 Stuttgart', category: 'bar', coordinates: [48.7784, 9.1793] },
  { name: 'reBOOTS Bar', address: 'Bopserstraße 9, 70180 Stuttgart', category: 'bar', coordinates: [48.7695, 9.1882] },
  { name: 'Weißes Roß Bar', address: 'Hauptstätter Straße 41, 70173 Stuttgart', category: 'bar', coordinates: [48.7686, 9.1755] },
  { name: 'Jigger & Spoon', address: 'Gymnasiumstraße 33, 70174 Stuttgart', category: 'bar', coordinates: [48.7812, 9.1752] },
  { name: 'WXYZ Bar (im Aloft)', address: 'Heilbronner Straße 70, 70191 Stuttgart', category: 'bar', coordinates: [48.7945, 9.1795] },
  
  // Clubs
  { name: 'Boa Discothek Stuttgart', address: 'Tübinger Straße 12–16, 70178 Stuttgart', category: 'club', coordinates: [48.7689, 9.1758] },
  { name: 'Rumors Club', address: 'Hauptstätter Straße 40, 70173 Stuttgart', category: 'club', coordinates: [48.7688, 9.1752] },
  { name: 'Proton The Club', address: 'Königstraße 49, 70173 Stuttgart', category: 'club', coordinates: [48.7786, 9.1790] },
  { name: 'Universum', address: 'Charlottenplatz 1, 70173 Stuttgart', category: 'club', coordinates: [48.7756, 9.1829] },
  { name: 'MICA Club', address: 'Kronprinzplatz, 70173 Stuttgart', category: 'club', coordinates: [48.7762, 9.1805] },
  { name: 'WONDERS Club', address: 'Friedrichstraße 13, 70174 Stuttgart', category: 'club', coordinates: [48.7797, 9.1768] },
  
  // Cafés
  { name: 'Kaffeerösterei Café Moulu', address: 'Senefelderstraße 58, 70176 Stuttgart', category: 'cafe', coordinates: [48.7765, 9.1625] },
  { name: 'Cafe Hegel', address: 'Eberhardstraße 35, 70173 Stuttgart', category: 'cafe', coordinates: [48.7752, 9.1778] },
  { name: 'Café Zuhause', address: 'Landhausstraße 201, 70188 Stuttgart', category: 'cafe', coordinates: [48.7885, 9.2055] },
  { name: 'Weltcafé Stuttgart', address: 'Charlottenplatz 17, 70173 Stuttgart', category: 'cafe', coordinates: [48.7758, 9.1835] },
  { name: 'Caffè-Bar', address: 'Torstraße 27, 70173 Stuttgart', category: 'cafe', coordinates: [48.7748, 9.1812] },
  { name: 'Mela Kaffee & Cafe', address: 'Königstraße 7, 70173 Stuttgart', category: 'cafe', coordinates: [48.7795, 9.1768] },
  { name: 'Glora Kaffeehaus', address: 'Calwer Straße 31, 70173 Stuttgart', category: 'cafe', coordinates: [48.7778, 9.1745] },
  { name: 'GLORA Kaffeehaus (Filiale)', address: 'Sophienstraße 24b, 70178 Stuttgart', category: 'cafe', coordinates: [48.7715, 9.1702] },
  { name: 'Café Moody', address: 'Uhlandstraße 26, 70182 Stuttgart', category: 'cafe', coordinates: [48.7728, 9.1868] },
];

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

// Create custom marker icons for each category
const createCustomIcon = (color: string, isEvent = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${isEvent ? '32px' : '24px'};
      height: ${isEvent ? '32px' : '24px'};
      border-radius: 50%;
      background-color: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ${isEvent ? 'animation: pulse 2s ease-in-out infinite;' : ''}
    "></div>
    ${isEvent ? `<style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 ${color}80; }
        50% { transform: scale(1.1); box-shadow: 0 0 20px 5px ${color}40; }
      }
    </style>` : ''}`,
    iconSize: [isEvent ? 32 : 24, isEvent ? 32 : 24],
    iconAnchor: [isEvent ? 16 : 12, isEvent ? 16 : 12],
    popupAnchor: [0, isEvent ? -16 : -12],
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
  const navigate = useNavigate();

  // Convert events to locations
  const eventLocations: Location[] = (events || [])
    .filter(event => event.latitude && event.longitude)
    .map(event => ({
      id: event.id,
      name: event.name,
      address: event.city || event.address,
      category: 'event' as const,
      coordinates: [event.latitude!, event.longitude!] as [number, number],
      eventData: {
        id: event.id,
        starts_at: event.starts_at,
        expected_attendees: event.expected_attendees || undefined,
      },
    }));

  // Combine static locations with events
  const allLocations = [...stuttgartLocations, ...eventLocations];

  const filteredLocations = selectedCategory
    ? allLocations.filter(l => l.category === selectedCategory)
    : allLocations;

  const getCategoryCount = (category: string) => {
    if (category === 'event') return eventLocations.length;
    return stuttgartLocations.filter(l => l.category === category).length;
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
        {filteredLocations.map((location, index) => (
          <Marker
            key={`${location.name}-${index}`}
            position={location.coordinates}
            icon={categoryIcons[location.category]}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold mb-1 text-gray-900 text-sm">{location.name}</h3>
                <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location.address}
                </p>
                
                {location.category === 'event' && location.eventData && (
                  <div className="space-y-2 mb-2">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(location.eventData.starts_at), 'dd. MMM, HH:mm', { locale: de })} Uhr
                    </p>
                    {location.eventData.expected_attendees && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        ~{location.eventData.expected_attendees} erwartet
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-2 bg-gradient-neon text-white text-xs"
                      onClick={() => navigate(`/events/${location.eventData!.id}`)}
                    >
                      Event ansehen
                    </Button>
                  </div>
                )}
                
                <span 
                  className="text-white px-2 py-0.5 rounded-full text-xs inline-block"
                  style={{ backgroundColor: categoryColors[location.category] }}
                >
                  {categoryLabels[location.category]}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-xl p-3 z-[1000]">
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
