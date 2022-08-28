import { computeDestinationPoint } from "geolib";
import { getLocID } from "./getLocID";
import { milesToMeters } from "./milesToMeters";
import { BoundingBox, Point } from "./scrape";
import * as geolib from "geolib";
import { fixedCoord, FIXSTEP } from "./fixedCoord";

export function getLocIDsforLocationSetting(
  location: Point,
  radius: number
): { locIDs: string[]; box: BoundingBox } {
  const ll = { latitude: location.x, longitude: location.y };
  const radiusMeters = milesToMeters(radius);
  const _top = computeDestinationPoint(ll, radiusMeters, 0);
  const _right = computeDestinationPoint(ll, radiusMeters, 90);
  const _bottom = computeDestinationPoint(ll, radiusMeters, 180);
  const _left = computeDestinationPoint(ll, radiusMeters, 270);
  const bounds = geolib.getBounds([_top, _right, _left, _bottom]);
  const box = {
    topLeft: { x: bounds.minLat, y: bounds.minLng },
    bottomRight: { x: bounds.maxLat, y: bounds.maxLng },
  };
  const left = fixedCoord(box.topLeft.x);
  const top = fixedCoord(box.topLeft.y);
  const bottom = fixedCoord(box.bottomRight.y);
  const right = fixedCoord(box.bottomRight.x);
  const DX = Math.round(right - left) + FIXSTEP;
  const DY = Math.round(top - bottom) - FIXSTEP;
  const result: string[] = [];
  for (let dy = 0; dy > DY; dy -= FIXSTEP) {
    for (let dx = 0; dx < DX; dx += FIXSTEP) {
      const x = left + dx;
      const y = bottom + dy;
      result.push(getLocID(x, y));
    }
  }
  return {
    locIDs: result,
    box,
  };
}
