import * as admin from "firebase-admin";
import { pick } from "lodash";
import { WazeAlert } from "./locations";

export async function notifyUser(
  userDoc: admin.firestore.DocumentReference,
  device: { os: "ios" | "android"; fcmToken: string },
  accident: WazeAlert
) {
  const title = `Accident Reported on ${accident.street}, ${accident.city}`;
  console.log("Send Notification", device, accident);
  await admin.messaging().send({
    notification: {
      title,
    },
    data: {
      accidentJSON: JSON.stringify(
        pick(
          accident,
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
