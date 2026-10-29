export type MapArea = { west: number; east: number; south: number; north: number };

/** Coordinates must be the same privacy-adjusted coordinates used by the map. */
export function isInMapArea(lat: number, lng: number, area: MapArea | null) {
  if (!area) return true;
  const longitudeMatches = area.west <= area.east
    ? lng >= area.west && lng <= area.east
    : lng >= area.west || lng <= area.east;
  return lat >= area.south && lat <= area.north && longitudeMatches;
}

export function approximateDistanceKm(from: [number, number], to: [number, number]) {
  const radians = (n: number) => n * Math.PI / 180;
  const dLat = radians(to[0] - from[0]);
  const dLng = radians(to[1] - from[1]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from[0])) * Math.cos(radians(to[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}