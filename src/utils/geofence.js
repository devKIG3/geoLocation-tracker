// Haversine formula to compute distance between two lat/lng points (in meters)
export function distanceMeters(
  { lat: lat1, lng: lng1 },
  { lat: lat2, lng: lng2 }
) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  // …compute dLat, dLng, a, c…
  return R * c;
}
