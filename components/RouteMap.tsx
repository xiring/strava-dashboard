'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { decodePolyline } from '@/lib/polyline';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  polyline: string;
}

function MapUpdater({ polyline }: { polyline: string }) {
  const map = useMap();
  const coordinates = decodePolyline(polyline);

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = coordinates.map(([lat, lng]) => [lat, lng] as [number, number]);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [coordinates, map]);

  return null;
}

export default function RouteMap({ polyline }: RouteMapProps) {
  const coordinates = decodePolyline(polyline);

  if (coordinates.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/5">
        <p className="text-gray-500 dark:text-gray-400">No route data available</p>
      </div>
    );
  }

  const center = coordinates[Math.floor(coordinates.length / 2)];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={coordinates}
          pathOptions={{ color: '#FC4C02', weight: 4 }}
        />
        <MapUpdater polyline={polyline} />
      </MapContainer>
    </div>
  );
}

