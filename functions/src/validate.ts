import { Point } from "./scrape";

export function validateLocation({ x, y }: Point) {
  if (x < -90 || x > 90) {
    throw new Error(`invalid latitude, ${x} is out of range -90 to 90`);
  }
  if (y < -180 || y > 180) {
    throw new Error(`invalid longitude, ${y} is out of range of -180 to 180`);
  }
}
