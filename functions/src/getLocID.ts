export function getLocID(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}
