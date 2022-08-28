import * as admin from "firebase-admin";
import { pick } from "lodash";
import { WazeAlert } from "./locations";
import { User } from "./user";

export async function notifyUser(
  userDoc: admin.firestore.DocumentReference,
  user: User,
  accident: WazeAlert
) {
  const title = user.subscriptionValid
    ? `Accident Reported on ${accident.street}, ${accident.city}`
    : `Accident Reported`;
  const device = user.device;
  if (!device || !device.fcmToken) return;
  console.log("Send Notification", device, accident);
  await admin.messaging().send({
    notification:
      device.os === "android"
        ? undefined
        : {
            title,
          },
    data: {
      title,
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
