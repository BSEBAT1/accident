import { Point } from "./scrape";

export function distance({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point) {
  function toRadians(value: number) {
    return (value * Math.PI) / 180;
  }

  var R = 3958.8;
  var rlat1 = toRadians(x1); // Convert degrees to radians
  var rlat2 = toRadians(x2); // Convert degrees to radians
  var difflat = rlat2 - rlat1; // Radian difference (latitudes)
  var difflon = toRadians(y2 - y1); // Radian difference (longitudes)
  return (
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2)
      )
    )
  );
}
