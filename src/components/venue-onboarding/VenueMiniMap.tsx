import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmV5cm4iLCJhIjoiY21tNjZrYm5xMGRwMTJwcnp5bmhwbGU2aSJ9.qvMwkRPWhHDXQYrsYpN2Yw';

interface Props {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}

export default function VenueMiniMap({ lat, lng, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: 15,
      attributionControl: false,
    });
    mapRef.current = map;

    // Custom pin element
    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.background = 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)';
    el.style.boxShadow = '0 0 24px rgba(236, 72, 153, 0.6), inset 0 0 0 2px rgba(255,255,255,0.9)';
    el.style.cursor = 'grab';

    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const ll = marker.getLngLat();
      onMove(ll.lat, ll.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker + center when lat/lng change externally (geocode result)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLngLat([lng, lat]);
    mapRef.current.easeTo({ center: [lng, lat], duration: 600 });
  }, [lat, lng]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 200, borderRadius: 14, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.1)' }}
      />
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
        Pin nicht richtig? Einfach verschieben 👇
      </p>
    </div>
  );
}
