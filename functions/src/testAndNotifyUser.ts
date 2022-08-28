import * as admin from "firebase-admin";
import { distance } from "./distance";
import { WazeAlert } from "./locations";
import { milesToMeters } from "./milesToMeters";
import { notifyUser } from "./notifyUser";

export async function testAndNotifyUser(userID: string, accident: WazeAlert) {
  const userDoc = admin.firestore().collection("users").doc(userID);
  const user = await userDoc.get();
  if (user.exists) {
    const data = user.data() as any;
    const { location, radius } = data.locationSubscription;
    if (distance(location, accident.location) <= milesToMeters(radius)) {
      if (data.device && data.device.fcmToken) {
        await notifyUser(userDoc, data.device, accident);
      }
      const notifications: string[] = data.notifications || [];
      notifications.unshift(accident.uuid);
      await userDoc.set({ notifications }, { merge: true });
    }
  }
}
