import * as admin from "firebase-admin";
import { WazeAlert } from "./locations";

export async function notifyUser(
  userDoc: admin.firestore.DocumentReference,
  device: { os: "ios" | "android"; token: string },
  alert: WazeAlert
) {
  const title = `Accident Reported on ${alert.street}, ${alert.city}`;
  await admin.messaging().send({
    notification: {
      title,
    },
    token: device.token,
  });
}
