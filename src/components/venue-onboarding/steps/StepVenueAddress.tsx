import { useEffect, useRef, useState } from 'react';
import VenueMiniMap from '../VenueMiniMap';
import { MAPBOX_TOKEN } from '@/lib/mapbox';

export interface AddressData {
  street: string;
  zip: string;
  city: string;
  lat: number | null;
  lng: number | null;
  skipped: boolean;
}

interface Props {
  value: AddressData;
  onChange: (v: AddressData) => void;
  allowSkip: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '0.5px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  padding: '14px 14px',
  fontSize: 15,
  outline: 'none',
  marginBottom: 10,
};

export default function StepVenueAddress({ value, onChange, allowSkip }: Props) {
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const allFilled = value.street.trim().length > 2 && /^\d{5}$/.test(value.zip) && value.city.trim().length > 1;

  // Debounced geocode
  useEffect(() => {
    if (value.skipped) return;
    if (!allFilled) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setGeocoding(true);
      try {
        const q = encodeURIComponent(`${value.street}, ${value.zip} ${value.city}, Germany`);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${MAPBOX_TOKEN}&country=de&limit=1`
        );
        const data = await res.json();
        const feat = data.features?.[0];
        if (feat?.center) {
          const [lng, lat] = feat.center;
          onChange({ ...value, lat, lng });
        }
      } catch {
        /* ignore */
      } finally {
        setGeocoding(false);
      }
    }, 800);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.street, value.zip, value.city, value.skipped]);

  if (value.skipped) {
    return (
      <div
        style={{
          padding: 18,
          borderRadius: 14,
          background: 'rgba(124, 58, 237, 0.12)',
          border: '0.5px solid rgba(127, 119, 221, 0.5)',
          color: '#fff',
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        🎪 Nomadenmodus aktiv — du kannst Spots später pro Event hinzufügen.
        <button
          onClick={() => onChange({ ...value, skipped: false })}
          style={{
            display: 'block',
            margin: '10px auto 0',
            fontSize: 12,
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'underline',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Doch eine Adresse angeben
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        style={inputStyle}
        type="text"
        placeholder="Straße + Hausnummer"
        value={value.street}
        onChange={(e) => onChange({ ...value, street: e.target.value })}
      />
      <input
        style={inputStyle}
        type="text"
        inputMode="numeric"
        maxLength={5}
        placeholder="PLZ"
        value={value.zip}
        onChange={(e) => onChange({ ...value, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })}
      />
      <input
        style={inputStyle}
        type="text"
        placeholder="Stadt"
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
      />

      {allowSkip && (
        <button
          onClick={() => onChange({ ...value, skipped: true, lat: null, lng: null })}
          style={{
            display: 'block',
            margin: '4px auto 12px',
            fontSize: 13,
            color: 'rgba(255,255,255,0.55)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Wir sind nomadisch — überspring das
        </button>
      )}

      {geocoding && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '8px 0' }}>
          Suche Adresse…
        </p>
      )}

      {value.lat != null && value.lng != null && (
        <div style={{ marginTop: 8 }}>
          <VenueMiniMap
            lat={value.lat}
            lng={value.lng}
            onMove={(lat, lng) => onChange({ ...value, lat, lng })}
          />
        </div>
      )}
    </div>
  );
}
