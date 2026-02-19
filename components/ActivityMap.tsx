'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { decodePolyline } from '@/lib/polyline';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';



// Fix for default marker icons in Next.js
// This will be set when the component mounts

const TILE_URLS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

interface ActivityMapProps {
  polyline: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  elapsedTime?: number; // in seconds
  distance?: number; // in meters
  darkStyle?: boolean;
}

export default function ActivityMap({
  polyline,
  startLat,
  startLng,
  endLat,
  endLng,
  elapsedTime,
  distance,
  darkStyle = false,
}: ActivityMapProps) {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 1
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x, etc.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fix Leaflet default icon issue in Next.js
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }
  }, []);

  const coordinates = useMemo(() => {
    if (!polyline) return [];
    return decodePolyline(polyline);
  }, [polyline]);

  // Calculate cumulative distances for each point
  const cumulativeDistances = useMemo(() => {
    if (coordinates.length === 0) return [0];
    
    const distances = [0];
    for (let i = 1; i < coordinates.length; i++) {
      const [lat1, lng1] = coordinates[i - 1];
      const [lat2, lng2] = coordinates[i];
      
      // Haversine formula for distance
      const R = 6371000; // Earth radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      
      distances.push(distances[i - 1] + dist);
    }
    return distances;
  }, [coordinates]);

  // Get coordinates up to current progress
  const visibleCoordinates = useMemo(() => {
    if (coordinates.length === 0) return [];
    const targetIndex = Math.floor(currentIndex);
    return coordinates.slice(0, targetIndex + 1);
  }, [coordinates, currentIndex]);

  // Get current position for moving marker
  const currentPosition = useMemo(() => {
    if (coordinates.length === 0) return null;
    const index = Math.floor(currentIndex);
    if (index >= coordinates.length) return coordinates[coordinates.length - 1];
    if (index < 0) return coordinates[0];
    
    // Interpolate between points for smooth movement
    const nextIndex = Math.min(index + 1, coordinates.length - 1);
    const fraction = currentIndex - index;
    const [lat1, lng1] = coordinates[index];
    const [lat2, lng2] = coordinates[nextIndex];
    
    return [
      lat1 + (lat2 - lat1) * fraction,
      lng1 + (lng2 - lng1) * fraction,
    ] as [number, number];
  }, [coordinates, currentIndex]);

  // Playback animation
  useEffect(() => {
    if (!isPlaying || coordinates.length === 0) return;

    const totalDuration = elapsedTime || 60; // Default to 60 seconds if not provided
    const animationDuration = totalDuration / playbackSpeed; // Adjust for speed
    const interval = 100; // Update every 100ms
    const step = (interval / 1000) / animationDuration; // Progress per interval

    const timer = setInterval(() => {
      setPlaybackProgress((prev) => {
        const newProgress = Math.min(prev + step, 1);
        const newIndex = newProgress * (coordinates.length - 1);
        setCurrentIndex(newIndex);
        
        if (newProgress >= 1) {
          setIsPlaying(false);
        }
        
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, coordinates.length, elapsedTime, playbackSpeed]);

  // Handle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle reset
  const resetPlayback = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentIndex(0);
  };

  // Handle progress slider change
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setPlaybackProgress(newProgress);
    const newIndex = newProgress * (coordinates.length - 1);
    setCurrentIndex(newIndex);
    setIsPlaying(false);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!mapContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await mapContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Calculate current distance and time
  const currentDistance = useMemo(() => {
    if (distance && cumulativeDistances.length > 0) {
      const totalDist = cumulativeDistances[cumulativeDistances.length - 1];
      return (totalDist * playbackProgress) / 1000; // Convert to km
    }
    return 0;
  }, [playbackProgress, distance, cumulativeDistances]);

  const currentTime = useMemo(() => {
    if (elapsedTime) {
      return Math.floor(elapsedTime * playbackProgress);
    }
    return 0;
  }, [playbackProgress, elapsedTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate bounds and center for the map
  const { bounds, center } = useMemo(() => {
    if (coordinates.length === 0) {
      return {
        bounds: [[0, 0], [0, 0]] as [[number, number], [number, number]],
        center: [0, 0] as [number, number],
      };
    }
    
    const latMin = Math.min(...coordinates.map(([lat]) => lat));
    const latMax = Math.max(...coordinates.map(([lat]) => lat));
    const lngMin = Math.min(...coordinates.map(([, lng]) => lng));
    const lngMax = Math.max(...coordinates.map(([, lng]) => lng));
    
    return {
      bounds: [[latMin, lngMin], [latMax, lngMax]] as [[number, number], [number, number]],
      center: [(latMin + latMax) / 2, (lngMin + lngMax) / 2] as [number, number],
    };
  }, [coordinates]);

  if (!mounted || !polyline) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (coordinates.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No route data available</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef}
      className={`w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}
    >
      {/* Playback Controls */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 border-b border-white/20 dark:border-white/5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
          <div className="flex items-center flex-wrap gap-3">
            <button
              onClick={togglePlayback}
              className="h-12 px-5 inline-flex items-center gap-2 bg-palette-light hover:bg-palette-medium text-palette-darkest rounded-lg font-semibold transition-colors"
            >
              {isPlaying ? (
                <>
                  <span>⏸</span>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <span>▶</span>
                  <span>Play</span>
                </>
              )}
            </button>
            <button
              onClick={resetPlayback}
              className="h-12 px-5 inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors"
            >
              ↺ Reset
            </button>
            <div className="flex items-center gap-2 ml-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
              {[1, 2, 4, 8, 20, 50, 100].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`h-10 px-4 rounded text-sm font-semibold transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-palette-light text-palette-darkest'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3 md:justify-end">
            <div className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
              {formatTime(currentTime)} / {elapsedTime ? formatTime(elapsedTime) : '--:--'}
              {distance && (
                <span className="ml-2">
                  ({currentDistance.toFixed(2)} km / {(distance / 1000).toFixed(2)} km)
                </span>
              )}
            </div>
            <button
              onClick={toggleFullscreen}
              className="h-12 px-4 inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <>
                  <span>⤓</span>
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <>
                  <span>⤢</span>
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={playbackProgress}
          onChange={handleProgressChange}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-palette-light"
        />
      </div>

      {/* Map */}
      <div className={isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'}>
        <MapContainer
          center={center}
          zoom={13}
          bounds={bounds}
          boundsOptions={{ padding: [20, 20] }}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          className="z-0"
        >
          <TileLayer
            attribution={darkStyle ? '&copy; <a href="https://carto.com/">CARTO</a>' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
            url={darkStyle ? TILE_URLS.dark : TILE_URLS.light}
          />
          {/* Full route (faded) */}
          <Polyline
            positions={coordinates}
            pathOptions={{
              color: '#FC4C02',
              weight: 3,
              opacity: 0.3,
            }}
          />
          {/* Progress route (highlighted) */}
          {visibleCoordinates.length > 1 && (
            <Polyline
              positions={visibleCoordinates}
              pathOptions={{
                color: '#FC4C02',
                weight: 4,
                opacity: 0.9,
              }}
            />
          )}
          {/* Start marker */}
          {startLat && startLng && (
            <Marker position={[startLat, startLng]}>
              <Popup>Start</Popup>
            </Marker>
          )}
          {/* Moving marker */}
          {currentPosition && (
            <Marker position={currentPosition}>
              <Popup>
                <div className="text-center">
                  <div className="font-semibold">Current Position</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(currentTime)}
                  </div>
                  {distance && (
                    <div className="text-sm text-gray-600">
                      {currentDistance.toFixed(2)} km
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          {/* End marker */}
          {endLat && endLng && playbackProgress >= 1 && (
            <Marker position={[endLat, endLng]}>
              <Popup>End</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

