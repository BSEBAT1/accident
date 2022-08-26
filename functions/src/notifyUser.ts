import * as admin from "firebase-admin";
import { pick } from "lodash";
import { WazeAlert } from "./locations";

export async function notifyUser(
  userDoc: admin.firestore.DocumentReference,
  device: { os: "ios" | "android"; fcmToken: string },
  alert: WazeAlert
) {
  const title = `Accident Reported on ${alert.street}, ${alert.city}`;
  await admin.messaging().send({
    notification: {
      title,
    },
    data: {
      alertJSON: JSON.stringify(
        pick(
          alert,
          "id",
          "location",
          "city",
          "street",
          "severity",
          "pubMillis",
          "reportRating",
          "reliability"
        )
      ),
    },
    token: device.fcmToken,
  });
}
