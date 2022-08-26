import { computeDestinationPoint } from "geolib";
import { getLocID } from "./getLocID";
import { milesToMeters } from "./milesToMeters";
import { BoundingBox, Point } from "./scrape";

export function getLocIDsforLocationSetting(
  location: Point,
  radius: number
): { locIDs: string[]; box: BoundingBox } {
  const radiusMeters = milesToMeters(radius);
  const _top = computeDestinationPoint(
    [location.x, location.y],
    radiusMeters,
    0
  );
  const _right = computeDestinationPoint(
    [location.x, location.y],
    radiusMeters,
    90
  );
  const _bottom = computeDestinationPoint(
    [location.x, location.y],
    radiusMeters,
    180
  );
  const _left = computeDestinationPoint(
    [location.x, location.y],
    radiusMeters,
    270
  );
  const left = Math.floor(Math.min(_left.latitude, _right.latitude) * 100);
  const top = Math.floor(Math.max(_top.longitude, _bottom.longitude) * 100);
  const bottom = Math.floor(Math.min(_top.longitude, _bottom.longitude) * 100);
  const right = Math.floor(Math.max(_right.latitude, _left.latitude) * 100);
  const DX = right - left + 1;
  const DY = top - bottom + 1;
  const result: string[] = [];
  for (let dy = 0; dy < DY; dy++) {
    for (let dx = 0; dx < DX; dx++) {
      const x = (left + dx) / 100.0;
      const y = (bottom + dy) / 100.0;
      result.push(getLocID(x, y));
    }
  }
  return {
    locIDs: result,
    box: {
      topLeft: { x: left / 100.0, y: top / 100.0 },
      bottomRight: { y: bottom / 100.0, x: left / 100.0 },
    },
  };
}
