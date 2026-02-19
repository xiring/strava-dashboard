/**
 * Export utilities for GPX and TCX formats
 */
import { decodePolyline } from './polyline';

export function exportToGpx(
  polyline: string,
  name: string,
  startDate: string,
  activityType?: string
): string {
  const coords = decodePolyline(polyline);
  if (!coords.length) return '';

  const safeName = (name || 'activity').replace(/[^\w\d-_]+/g, '_');
  const time = new Date(startDate).toISOString();

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="strava-dashboard" xmlns="http://www.topografix.com/GPX/1/1">\n` +
    `  <metadata>\n` +
    `    <name>${safeName}</name>\n` +
    `    <time>${time}</time>\n` +
    `  </metadata>\n` +
    `  <trk>\n` +
    `    <name>${safeName}</name>\n` +
    `    <type>${activityType || 'unknown'}</type>\n` +
    `    <trkseg>\n` +
    coords.map(([lat, lon]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`).join('\n') +
    `\n    </trkseg>\n` +
    `  </trk>\n` +
    `</gpx>`
  );
}

export function exportToTcx(
  polyline: string,
  name: string,
  startDate: string,
  movingTimeSeconds: number,
  distanceMeters: number,
  activityType?: string
): string {
  const coords = decodePolyline(polyline);
  if (!coords.length) return '';

  const safeName = (name || 'activity').replace(/[^\w\d-_]+/g, '_');
  const startTime = new Date(startDate).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const sport = activityType === 'Run' ? 'Running' : activityType === 'Ride' ? 'Biking' : 'Other';

  const interval = coords.length > 1 ? movingTimeSeconds / (coords.length - 1) : 0;
  const trackpoints = coords
    .map(([lat, lon], i) => {
      const ptTime = new Date(new Date(startDate).getTime() + i * interval * 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z');
      return (
        `        <Trackpoint>\n` +
        `          <Time>${ptTime}</Time>\n` +
        `          <Position>\n` +
        `            <LatitudeDegrees>${lat}</LatitudeDegrees>\n` +
        `            <LongitudeDegrees>${lon}</LongitudeDegrees>\n` +
        `          </Position>\n` +
        `        </Trackpoint>`
      );
    })
    .join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">\n` +
    `  <Activities>\n` +
    `    <Activity Sport="${sport}">\n` +
    `      <Id>${startTime}</Id>\n` +
    `      <Lap StartTime="${startTime}">\n` +
    `        <TotalTimeSeconds>${movingTimeSeconds}</TotalTimeSeconds>\n` +
    `        <DistanceMeters>${distanceMeters}</DistanceMeters>\n` +
    `        <Track>\n` +
    trackpoints +
    `\n        </Track>\n` +
    `      </Lap>\n` +
    `    </Activity>\n` +
    `  </Activities>\n` +
    `</TrainingCenterDatabase>`
  );
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
