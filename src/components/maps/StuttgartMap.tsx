import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Key } from 'lucide-react';

interface Location {
  name: string;
  address: string;
  category: 'bar' | 'club' | 'cafe';
  coordinates: [number, number]; // [lng, lat]
}

const stuttgartLocations: Location[] = [
  // Bars
  { name: 'Schwarz Weiß Bar', address: 'Wilhelmstraße 8A, 70182 Stuttgart', category: 'bar', coordinates: [9.1850, 48.7738] },
  { name: 'anderthalb Bar', address: 'Königstraße 47, 70173 Stuttgart', category: 'bar', coordinates: [9.1793, 48.7784] },
  { name: 'reBOOTS Bar', address: 'Bopserstraße 9, 70180 Stuttgart', category: 'bar', coordinates: [9.1882, 48.7695] },
  { name: 'Weißes Roß Bar', address: 'Hauptstätter Straße 41, 70173 Stuttgart', category: 'bar', coordinates: [9.1755, 48.7686] },
  { name: 'Jigger & Spoon', address: 'Gymnasiumstraße 33, 70174 Stuttgart', category: 'bar', coordinates: [9.1752, 48.7812] },
  { name: 'WXYZ Bar (im Aloft)', address: 'Heilbronner Straße 70, 70191 Stuttgart', category: 'bar', coordinates: [9.1795, 48.7945] },
  
  // Clubs
  { name: 'Boa Discothek Stuttgart', address: 'Tübinger Straße 12–16, 70178 Stuttgart', category: 'club', coordinates: [9.1758, 48.7689] },
  { name: 'Rumors Club', address: 'Hauptstätter Straße 40, 70173 Stuttgart', category: 'club', coordinates: [9.1752, 48.7688] },
  { name: 'Proton The Club', address: 'Königstraße 49, 70173 Stuttgart', category: 'club', coordinates: [9.1790, 48.7786] },
  { name: 'Universum', address: 'Charlottenplatz 1, 70173 Stuttgart', category: 'club', coordinates: [9.1829, 48.7756] },
  { name: 'MICA Club', address: 'Kronprinzplatz, 70173 Stuttgart', category: 'club', coordinates: [9.1805, 48.7762] },
  { name: 'WONDERS Club', address: 'Friedrichstraße 13, 70174 Stuttgart', category: 'club', coordinates: [9.1768, 48.7797] },
  
  // Cafés
  { name: 'Kaffeerösterei Café Moulu', address: 'Senefelderstraße 58, 70176 Stuttgart', category: 'cafe', coordinates: [9.1625, 48.7765] },
  { name: 'Cafe Hegel', address: 'Eberhardstraße 35, 70173 Stuttgart', category: 'cafe', coordinates: [9.1778, 48.7752] },
  { name: 'Café Zuhause', address: 'Landhausstraße 201, 70188 Stuttgart', category: 'cafe', coordinates: [9.2055, 48.7885] },
  { name: 'Weltcafé Stuttgart', address: 'Charlottenplatz 17, 70173 Stuttgart', category: 'cafe', coordinates: [9.1835, 48.7758] },
  { name: 'Caffè-Bar', address: 'Torstraße 27, 70173 Stuttgart', category: 'cafe', coordinates: [9.1812, 48.7748] },
  { name: 'Mela Kaffee & Cafe', address: 'Königstraße 7, 70173 Stuttgart', category: 'cafe', coordinates: [9.1768, 48.7795] },
  { name: 'Glora Kaffeehaus', address: 'Calwer Straße 31, 70173 Stuttgart', category: 'cafe', coordinates: [9.1745, 48.7778] },
  { name: 'GLORA Kaffeehaus (Filiale)', address: 'Sophienstraße 24b, 70178 Stuttgart', category: 'cafe', coordinates: [9.1702, 48.7715] },
  { name: 'Café Moody', address: 'Uhlandstraße 26, 70182 Stuttgart', category: 'cafe', coordinates: [9.1868, 48.7728] },
];

const categoryColors = {
  bar: '#f97316', // Orange
  club: '#a855f7', // Purple
  cafe: '#22c55e', // Green
};

const categoryLabels = {
  bar: '🍸 Bar',
  club: '🎧 Club',
  cafe: '☕ Café',
};

export function StuttgartMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [9.1829, 48.7758], // Stuttgart center
      zoom: 13,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsMapLoaded(true);
      addMarkers();
    });
  };

  const addMarkers = () => {
    if (!map.current) return;

    stuttgartLocations.forEach((location) => {
      if (selectedCategory && location.category !== selectedCategory) return;

      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = categoryColors[location.category];
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';
      el.onmouseenter = () => { el.style.transform = 'scale(1.2)'; };
      el.onmouseleave = () => { el.style.transform = 'scale(1)'; };

      new mapboxgl.Marker(el)
        .setLngLat(location.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px; color: #1a1a1a;">${location.name}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${location.address}</p>
              <span style="background: ${categoryColors[location.category]}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                ${categoryLabels[location.category]}
              </span>
            </div>
          `)
        )
        .addTo(map.current!);
    });
  };

  const handleSubmitToken = () => {
    if (inputToken.trim()) {
      setMapboxToken(inputToken.trim());
      localStorage.setItem('mapbox_token', inputToken.trim());
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (mapboxToken && !map.current) {
      initializeMap(mapboxToken);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  if (!mapboxToken) {
    return (
      <Card className="p-6 m-4 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Mapbox Token erforderlich</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Für die Karte brauchst du einen kostenlosen Mapbox Token.
              <br />
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Hier bei Mapbox registrieren →
              </a>
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-md">
            <Input
              placeholder="pk.eyJ1Ijoi..."
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSubmitToken} disabled={!inputToken.trim()}>
              <MapPin className="h-4 w-4 mr-2" />
              Karte laden
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border/50">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border/50">
        <div className="text-xs font-semibold mb-2">Stuttgart Locations</div>
        <div className="flex flex-col gap-1.5">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`flex items-center gap-2 text-xs px-2 py-1 rounded transition-colors ${
                selectedCategory === key ? 'bg-primary/20' : 'hover:bg-muted'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: categoryColors[key as keyof typeof categoryColors] }}
              />
              <span>{label}</span>
              <span className="text-muted-foreground ml-auto">
                {stuttgartLocations.filter(l => l.category === key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
}
