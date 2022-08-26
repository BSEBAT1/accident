import axios from "axios";
import { WazeAlert } from "./locations";

export type Point = {
  x: number; // latitude
  y: number; // longitude
};

export type BoundingBox = {
  topLeft: Point;
  bottomRight: Point;
};

const REFERER = "https://www.waze.com/live-map";
const ENDPOINT = "https://www.waze.com/rtserver/web/TGeoRSS";

export async function doWazeFetch(bb: BoundingBox): Promise<WazeAlert[]> {
  const bottom = Math.min(bb.topLeft.x, bb.bottomRight.x);
  // const bottom = bb.bottomRight.y;
  const top = Math.max(bb.topLeft.x, bb.bottomRight.x);
  // const top = bb.topLeft.y;
  const left = Math.min(bb.topLeft.y, bb.bottomRight.y);
  // const left = bb.topLeft.x;
  const right = Math.max(bb.topLeft.y, bb.bottomRight.y);
  // const right = bb.bottomRight.x;
  const res = await axios.get(ENDPOINT, {
    headers: { Referer: REFERER },
    params: {
      bottom,
      left,
      top,
      right,
      ma: 500,
      mu: 0,
    },
  });
  const json = res.data;
  return json.alerts;
}
