import * as admin from "firebase-admin";
import { distance } from "./distance";
import { WazeAlert } from "./locations";
import { milesToMeters } from "./milesToMeters";
import { notifyUser } from "./notifyUser";
import { User } from "./user";

export async function testAndNotifyUser(userID: string, accident: WazeAlert) {
  const userDoc = admin.firestore().collection("users").doc(userID);
  const user = await userDoc.get();
  if (user.exists) {
    const data = user.data() as User | undefined;
    if (!data) return;
    if (!data.locationSubscription) return;
    const { location, radius } = data.locationSubscription;
    const d = distance(location, accident.location);
    console.log("test user notification", location, accident.location, d);
    if (d <= milesToMeters(radius)) {
      if (data.device && data.device.fcmToken) {
        try {
          await notifyUser(userDoc, data, accident);
        } catch (err) {
          console.error("Error notifying user", err);
          await userDoc.set(
            { device: admin.firestore.FieldValue.delete() },
            { merge: true }
          );
        }
      }
      const notifications: string[] = data.notifications || [];
      notifications.unshift(accident.uuid);
      await userDoc.set({ notifications }, { merge: true });
    }
  }
}
