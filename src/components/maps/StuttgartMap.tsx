import React, { useEffect, useRef, useState } from 'react';
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

declare global {
  interface Window {
    smartmaps: any;
  }
}

export function StuttgartMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [smartmapsToken, setSmartmapsToken] = useState('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);

  // Load SmartMaps script
  useEffect(() => {
    if (document.getElementById('smartmaps-script')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'smartmaps-script';
    script.src = 'https://www.smartmaps.net/maps/api/v5/smartmaps.min.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    // Add SmartMaps CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://www.smartmaps.net/maps/api/v5/smartmaps.min.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || mapInstance.current || !window.smartmaps) return;

    try {
      mapInstance.current = new window.smartmaps.maps.Map(mapContainer.current, token, {
        center: { lat: 48.7758, lng: 9.1829 }, // Stuttgart center
        zoom: 13,
      });

      mapInstance.current.on('load', () => {
        setIsMapLoaded(true);
        addMarkers();
      });
    } catch (error) {
      console.error('Error initializing SmartMaps:', error);
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    markersRef.current = [];
  };

  const addMarkers = () => {
    if (!mapInstance.current) return;

    clearMarkers();

    const filteredLocations = selectedCategory 
      ? stuttgartLocations.filter(l => l.category === selectedCategory)
      : stuttgartLocations;

    filteredLocations.forEach((location) => {
      try {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'smartmaps-custom-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = categoryColors[location.category];
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.transition = 'transform 0.2s';
        el.title = location.name;
        
        el.onmouseenter = () => { el.style.transform = 'scale(1.2)'; };
        el.onmouseleave = () => { el.style.transform = 'scale(1)'; };

        // Create popup content
        const popupContent = `
          <div style="padding: 8px; min-width: 180px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; color: #1a1a1a; font-size: 14px;">${location.name}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${location.address}</p>
            <span style="background: ${categoryColors[location.category]}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${categoryLabels[location.category]}
            </span>
          </div>
        `;

        // Add marker using SmartMaps API
        if (window.smartmaps.maps.Marker) {
          const marker = new window.smartmaps.maps.Marker({
            position: { lat: location.coordinates[1], lng: location.coordinates[0] },
            map: mapInstance.current,
            element: el,
          });

          // Add popup/info window
          if (window.smartmaps.maps.InfoWindow) {
            const infoWindow = new window.smartmaps.maps.InfoWindow({
              content: popupContent,
            });

            el.onclick = () => {
              infoWindow.open(mapInstance.current, marker);
            };
          }

          markersRef.current.push(marker);
        }
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  };

  // Re-add markers when category changes
  useEffect(() => {
    if (isMapLoaded && mapInstance.current) {
      addMarkers();
    }
  }, [selectedCategory, isMapLoaded]);

  const handleSubmitToken = () => {
    if (inputToken.trim()) {
      setSmartmapsToken(inputToken.trim());
      localStorage.setItem('smartmaps_token', inputToken.trim());
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('smartmaps_token');
    if (savedToken) {
      setSmartmapsToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (smartmapsToken && scriptLoaded && !mapInstance.current) {
      initializeMap(smartmapsToken);
    }

    return () => {
      if (mapInstance.current && mapInstance.current.remove) {
        mapInstance.current.remove();
      }
      mapInstance.current = null;
    };
  }, [smartmapsToken, scriptLoaded]);

  if (!smartmapsToken) {
    return (
      <Card className="p-6 m-4 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">SmartMaps API-Key erforderlich</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Für die Karte brauchst du einen SmartMaps API-Key.
              <br />
              <a 
                href="https://smartmaps.net/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Hier bei SmartMaps registrieren →
              </a>
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-md">
            <Input
              placeholder="Dein SmartMaps API-Key..."
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
      
      {/* Loading state */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Karte wird geladen...</p>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border/50 z-10">
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
