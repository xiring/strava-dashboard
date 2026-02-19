'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Map, {
  FullscreenControl,
  Layer,
  MapRef,
  Marker,
  NavigationControl,
  Source,
  type LayerProps,
} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { decodePolyline } from '@/lib/polyline';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ActivityMap3DProps {
  polyline: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  elapsedTime?: number; // in seconds
  distance?: number; // in meters
}

type EasingMode = 'linear' | 'easeInOut';

const baseLineStyle: LayerProps = {
  id: 'route-base',
  type: 'line',
  paint: {
    'line-color': '#FC4C02',
    'line-width': 3,
    'line-opacity': 0.25,
  },
};

const progressLineStyle: LayerProps = {
  id: 'route-progress',
  type: 'line',
  paint: {
    'line-color': '#FC4C02',
    'line-width': 5,
    'line-opacity': 0.9,
  },
};

export default function ActivityMap3D({
  polyline,
  startLat,
  startLng,
  endLat,
  endLng,
  elapsedTime,
  distance,
}: ActivityMap3DProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0..1
  const [playbackSpeed, setPlaybackSpeed] = useState(2); // 2x feels better for 3D
  const [currentIndex, setCurrentIndex] = useState(0);
  const [easingMode, setEasingMode] = useState<EasingMode>('easeInOut');
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastCameraUpdateRef = useRef<number>(0);

  const coordinates = useMemo(() => {
    if (!polyline) return [];
    return decodePolyline(polyline);
  }, [polyline]);

  const lngLatCoords = useMemo(
    () => coordinates.map(([lat, lng]) => [lng, lat] as [number, number]),
    [coordinates]
  );

  // Precompute cumulative distances (meters)
  const cumulativeDistances = useMemo(() => {
    if (lngLatCoords.length === 0) return [0];
    const distances = [0];
    for (let i = 1; i < lngLatCoords.length; i++) {
      const [lng1, lat1] = lngLatCoords[i - 1];
      const [lng2, lat2] = lngLatCoords[i];
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distances.push(distances[i - 1] + R * c);
    }
    return distances;
  }, [lngLatCoords]);

  const totalDistanceMeters = cumulativeDistances[cumulativeDistances.length - 1] || 0;

  const applyEasing = useCallback(
    (t: number) => {
      if (easingMode === 'easeInOut') {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
      return t;
    },
    [easingMode]
  );

  const easedProgress = useMemo(() => applyEasing(playbackProgress), [playbackProgress, applyEasing]);

  const progressDistance = useMemo(() => {
    if (totalDistanceMeters === 0) return 0;
    return totalDistanceMeters * easedProgress;
  }, [easedProgress, totalDistanceMeters]);

  // Locate position along path for a given traveled distance
  const positionAtDistance = useMemo(() => {
    if (lngLatCoords.length === 0) return null;
    if (progressDistance <= 0 || totalDistanceMeters === 0) {
      return { position: lngLatCoords[0], indexFloat: 0 };
    }
    const target = Math.min(progressDistance, totalDistanceMeters);
    const idx = cumulativeDistances.findIndex((d) => d >= target);
    if (idx <= 0) {
      return { position: lngLatCoords[0], indexFloat: 0 };
    }
    const prevDist = cumulativeDistances[idx - 1];
    const nextDist = cumulativeDistances[idx];
    const span = nextDist - prevDist || 1;
    const frac = Math.min(Math.max((target - prevDist) / span, 0), 1);
    const [lng1, lat1] = lngLatCoords[idx - 1];
    const [lng2, lat2] = lngLatCoords[idx];
    const interp: [number, number] = [lng1 + (lng2 - lng1) * frac, lat1 + (lat2 - lat1) * frac];
    return { position: interp, indexFloat: idx - 1 + frac };
  }, [lngLatCoords, progressDistance, cumulativeDistances, totalDistanceMeters]);

  const bounds = useMemo(() => {
    if (lngLatCoords.length === 0) return null;
    const base = new maplibregl.LngLatBounds(lngLatCoords[0], lngLatCoords[0]);
    lngLatCoords.forEach((coord) => base.extend(coord));
    return base;
  }, [lngLatCoords]);

  const visibleCoordinates = useMemo(() => {
    if (!positionAtDistance) return [];
    const { indexFloat, position } = positionAtDistance;
    const idx = Math.floor(indexFloat);
    const base = lngLatCoords.slice(0, idx + 1);
    if (idx < lngLatCoords.length) base.push(position);
    return base;
  }, [lngLatCoords, positionAtDistance]);

  const currentPosition = positionAtDistance?.position ?? null;

  // Playback animation (requestAnimationFrame for smoother updates)
  useEffect(() => {
    if (!isPlaying || coordinates.length === 0) return;

    const totalDuration = elapsedTime || 60;
    const animationDuration = totalDuration / playbackSpeed;

    const step = (timestamp: number) => {
      const last = lastFrameRef.current ?? timestamp;
      const deltaSeconds = (timestamp - last) / 1000;
      lastFrameRef.current = timestamp;

      setPlaybackProgress((prev) => {
        const newProgress = Math.min(prev + deltaSeconds / animationDuration, 1);
        // Derive fractional index from distance so speed adapts to segment length
        if (totalDistanceMeters > 0) {
          const target = totalDistanceMeters * applyEasing(newProgress);
          const idx = cumulativeDistances.findIndex((d) => d >= target);
          if (idx > 0) {
            const prevDist = cumulativeDistances[idx - 1];
            const nextDist = cumulativeDistances[idx];
            const span = nextDist - prevDist || 1;
            const frac = Math.min(Math.max((target - prevDist) / span, 0), 1);
            setCurrentIndex(idx - 1 + frac);
          }
        }

        if (newProgress >= 1) {
          setIsPlaying(false);
        }
        return newProgress;
      });

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      lastFrameRef.current = null;
    };
  }, [coordinates.length, elapsedTime, isPlaying, playbackSpeed, totalDistanceMeters, applyEasing, cumulativeDistances]);

  // Keep camera following the athlete (throttled to reduce jank)
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;
    const map = mapRef.current;
    const now = performance.now();
    if (now - lastCameraUpdateRef.current < 200) return;
    lastCameraUpdateRef.current = now;

    map.easeTo({
      center: currentPosition,
      duration: 300,
      zoom: Math.max(map.getZoom(), 13),
      pitch: Math.max(map.getPitch(), 55),
      bearing: map.getBearing() || -20,
      essential: true,
    });
  }, [currentPosition]);

  // Fit bounds on load
  const handleMapLoad = (event: any) => {
    const map = event.target as maplibregl.Map;
    mapRef.current = map as unknown as MapRef;

    if (!map.getSource('terrarium-dem')) {
      map.addSource('terrarium-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium',
      });
      map.setTerrain({ source: 'terrarium-dem', exaggeration: 1.5 });
    }

    if (bounds) {
      map.fitBounds(bounds, { padding: 60, duration: 0 });
    }
  };

  const togglePlayback = () => {
    setIsPlaying((prev) => !prev);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentIndex(0);
  };

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setPlaybackProgress(newProgress);
    if (totalDistanceMeters > 0) {
      const target = totalDistanceMeters * applyEasing(newProgress);
      const idx = cumulativeDistances.findIndex((d) => d >= target);
      if (idx > 0) {
        const prevDist = cumulativeDistances[idx - 1];
        const nextDist = cumulativeDistances[idx];
        const span = nextDist - prevDist || 1;
        const frac = Math.min(Math.max((target - prevDist) / span, 0), 1);
        setCurrentIndex(idx - 1 + frac);
      }
    }
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const currentDistance = useMemo(() => {
    if (distance && coordinates.length > 0) {
      return (distance * playbackProgress) / 1000;
    }
    return 0;
  }, [distance, playbackProgress, coordinates.length]);

  const currentTime = useMemo(() => {
    if (elapsedTime) {
      return Math.floor(elapsedTime * playbackProgress);
    }
    return 0;
  }, [elapsedTime, playbackProgress]);

  if (!polyline) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No route data available</p>
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
    <div className="w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
      {/* Playback Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
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
              {[1, 2, 4, 8, 20].map((speed) => (
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
            <div className="flex items-center gap-2 ml-2 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">Motion:</span>
              {(['linear', 'easeInOut'] as EasingMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEasingMode(mode)}
                  className={`h-10 px-4 rounded text-sm font-semibold transition-colors ${
                    easingMode === mode
                      ? 'bg-palette-light text-palette-darkest'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  aria-pressed={easingMode === mode}
                >
                  {mode === 'linear' ? 'Linear' : 'Ease'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3 md:justify-end text-sm text-gray-600 dark:text-gray-400">
            <div className="leading-tight">
              {formatTime(currentTime)} / {elapsedTime ? formatTime(elapsedTime) : '--:--'}
            </div>
            {distance && (
              <div className="leading-tight">
                ({currentDistance.toFixed(2)} km / {(distance / 1000).toFixed(2)} km)
              </div>
            )}
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
      <div className="h-[500px] relative">
        <Map
          onLoad={handleMapLoad}
          mapLib={maplibregl as any}
          mapStyle="https://demotiles.maplibre.org/style.json"
          initialViewState={{
            longitude: lngLatCoords[0]?.[0] || 0,
            latitude: lngLatCoords[0]?.[1] || 0,
            zoom: 12,
            pitch: 60,
            bearing: -20,
          }}
          terrain={{ source: 'terrarium-dem', exaggeration: 1.5 }}
          style={{ width: '100%', height: '100%' }}
          projection={{ name: 'mercator' }}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />

          <Source id="route" type="geojson" data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: lngLatCoords } }}>
            <Layer {...baseLineStyle} />
          </Source>

          {visibleCoordinates.length > 1 && (
            <Source
              id="route-progress"
              type="geojson"
              data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: visibleCoordinates } }}
            >
              <Layer {...progressLineStyle} />
            </Source>
          )}

          {startLat && startLng && (
            <Marker longitude={startLng} latitude={startLat} anchor="bottom">
              <div className="bg-white text-gray-800 px-2 py-1 rounded shadow text-xs font-semibold">Start</div>
            </Marker>
          )}

          {currentPosition && (
            <Marker longitude={currentPosition[0]} latitude={currentPosition[1]} anchor="bottom">
              <div className="text-2xl">🚴</div>
            </Marker>
          )}

          {endLat && endLng && playbackProgress >= 1 && (
            <Marker longitude={endLng} latitude={endLat} anchor="bottom">
              <div className="bg-white text-gray-800 px-2 py-1 rounded shadow text-xs font-semibold">End</div>
            </Marker>
          )}
        </Map>
      </div>
    </div>
  );
}

