type Coordinate = { latitude: number; longitude: number };

const EARTH_RADIUS_METERS = 6_371_000;

export const TRAILHEAD_RADIUS_METERS = 500;

export function distanceToTrailhead(from: Coordinate, trailhead: Coordinate) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(trailhead.latitude - from.latitude);
  const longitudeDelta = toRadians(trailhead.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const trailheadLatitude = toRadians(trailhead.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(trailheadLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
