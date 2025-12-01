import { StravaActivity } from './strava';
import { decodePolyline } from './polyline';

export function exportToCSV(activities: StravaActivity[], filename: string = 'strava-activities.csv') {
  if (activities.length === 0) {
    return;
  }

  const headers = [
    'Date',
    'Name',
    'Type',
    'Distance (km)',
    'Moving Time',
    'Elapsed Time',
    'Elevation Gain (m)',
    'Average Speed (km/h)',
    'Max Speed (km/h)',
    'Average Heart Rate',
    'Max Heart Rate',
    'Calories',
    'Kudos',
    'Comments',
  ];

  const rows = activities.map((activity) => {
    const date = new Date(activity.start_date_local).toLocaleString();
    const distance = (activity.distance / 1000).toFixed(2);
    const movingTime = formatTime(activity.moving_time);
    const elapsedTime = formatTime(activity.elapsed_time);
    const avgSpeed = ((activity.average_speed * 3600) / 1000).toFixed(2);
    const maxSpeed = ((activity.max_speed * 3600) / 1000).toFixed(2);

    return [
      date,
      activity.name,
      activity.type,
      distance,
      movingTime,
      elapsedTime,
      Math.round(activity.total_elevation_gain),
      avgSpeed,
      maxSpeed,
      activity.average_heartrate || '',
      activity.max_heartrate || '',
      activity.calories || '',
      activity.kudos_count,
      activity.comment_count,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(activities: StravaActivity[], filename: string = 'strava-activities.json') {
  const data = JSON.stringify(activities, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function exportToGPX(activities: StravaActivity[], filename: string = 'strava-activities.gpx') {
  if (activities.length === 0) {
    return;
  }

  let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Strava Dashboard" xmlns="http://www.topografix.com/GPX/1/1">
`;

  activities.forEach((activity) => {
    const polyline = activity.map?.summary_polyline || activity.map?.polyline;
    if (!polyline) return;

    const date = new Date(activity.start_date_local).toISOString();
    const coordinates = decodePolyline(polyline);

    if (coordinates.length === 0) return;

    gpxContent += `  <trk>
    <name><![CDATA[${activity.name.replace(/]]>/g, ']]&gt;')}]]></name>
    <type>${activity.type}</type>
    <trkseg>
`;

    coordinates.forEach(([lat, lng]) => {
      gpxContent += `      <trkpt lat="${lat}" lon="${lng}">
        <time>${date}</time>
      </trkpt>
`;
    });

    gpxContent += `    </trkseg>
  </trk>
`;
  });

  gpxContent += `</gpx>`;

  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToTCX(activities: StravaActivity[], filename: string = 'strava-activities.tcx') {
  if (activities.length === 0) {
    return;
  }

  let tcxContent = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
`;

  activities.forEach((activity) => {
    const date = new Date(activity.start_date_local).toISOString();
    const duration = activity.moving_time;
    const distance = activity.distance / 1000; // Convert to km

    tcxContent += `    <Activity Sport="${activity.type}">
      <Id>${date}</Id>
      <Lap StartTime="${date}">
        <TotalTimeSeconds>${duration}</TotalTimeSeconds>
        <DistanceMeters>${activity.distance}</DistanceMeters>
        <Calories>${activity.calories || 0}</Calories>
        <Intensity>Active</Intensity>
      </Lap>
    </Activity>
`;
  });

  tcxContent += `  </Activities>
</TrainingCenterDatabase>`;

  const blob = new Blob([tcxContent], { type: 'application/vnd.garmin.tcx+xml' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(activities: StravaActivity[], filename: string = 'strava-activities.xlsx') {
  // Simple CSV export as Excel-compatible format
  // For full Excel support, would need a library like xlsx
  exportToCSV(activities, filename.replace('.xlsx', '.csv'));
}


