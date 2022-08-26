import { WazeAlert } from "./locations";
import { processAccident } from "./processAccident";

export async function processAlerts(alerts: WazeAlert[]) {
  const accidents = alerts.filter((alert) => alert.type === "ACCIDENT");
  await Promise.all(accidents.map(processAccident));
}
