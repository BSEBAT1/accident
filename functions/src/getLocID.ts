import { FIX, fixedCoord } from "./fixedCoord";

export function getLocID(lat: number, lng: number) {
  return `${fixedCoord(lat).toFixed(FIX)},${fixedCoord(lng).toFixed(FIX)}`;
}
