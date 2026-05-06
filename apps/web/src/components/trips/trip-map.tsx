'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TripPlace } from '@roamera/types';

// Fix Leaflet's default icon paths for Next.js / webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#f97316',
  hotel: '#3b82f6',
  attraction: '#8b5cf6',
  museum: '#8b5cf6',
  transport: '#6b7280',
  shopping: '#ec4899',
  cafe: '#a78bfa',
  activity: '#10b981',
};

function createMarkerIcon(color: string, isSelected: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background: ${color};
      width: ${isSelected ? 20 : 14}px;
      height: ${isSelected ? 20 : 14}px;
      border-radius: 50%;
      border: ${isSelected ? 3 : 2}px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.2s;
    "></div>`,
    iconSize: [isSelected ? 20 : 14, isSelected ? 20 : 14],
    iconAnchor: [isSelected ? 10 : 7, isSelected ? 10 : 7],
  });
}

function FitBounds({ places }: { places: TripPlace[] }) {
  const map = useMap();

  useEffect(() => {
    const validPlaces = places.filter((p) => p.lat != null && p.lng != null);
    if (validPlaces.length === 0) return;

    if (validPlaces.length === 1) {
      map.setView([validPlaces[0].lat!, validPlaces[0].lng!], 14);
    } else {
      const bounds = L.latLngBounds(validPlaces.map((p) => [p.lat!, p.lng!]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [places.map((p) => `${p.lat},${p.lng}`).join()]);

  return null;
}

interface Props {
  places: TripPlace[];
  selectedPlaceId: string | null;
  onPlaceClick: (placeId: string) => void;
}

export default function TripMap({ places, selectedPlaceId, onPlaceClick }: Props) {
  const validPlaces = places.filter((p) => p.lat != null && p.lng != null);

  const center: [number, number] = validPlaces.length > 0
    ? [validPlaces[0].lat!, validPlaces[0].lng!]
    : [20.5937, 78.9629]; // Default: India center

  return (
    <MapContainer
      center={center}
      zoom={validPlaces.length > 0 ? 10 : 5}
      style={{ height: '100%', width: '100%', minHeight: 400 }}
      className="rounded-xl z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <FitBounds places={validPlaces} />

      {validPlaces.map((place) => {
        const color = CATEGORY_COLORS[place.category ?? ''] ?? '#0D9488';
        const isSelected = place.id === selectedPlaceId;
        const icon = createMarkerIcon(color, isSelected);

        return (
          <Marker
            key={place.id}
            position={[place.lat!, place.lng!]}
            icon={icon}
            eventHandlers={{ click: () => onPlaceClick(place.id) }}
            zIndexOffset={isSelected ? 1000 : 0}
          >
            <Popup>
              <div className="text-sm font-medium">{place.name}</div>
              {place.address && <div className="text-xs text-slate-500 mt-0.5">{place.address}</div>}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
