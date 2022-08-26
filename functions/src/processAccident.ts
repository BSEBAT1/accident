import * as admin from "firebase-admin";
import { WazeAlert } from "./locations";
import { testAndNotifyUser } from "./testAndNotifyUser";
import { getLocID } from "./getLocID";

export async function processAccident(alert: WazeAlert) {
  const doc = admin.firestore().collection("accidents").doc(alert.id);
  const ref = await doc.get();
  if (!ref.exists) {
    await doc.create(alert);
    const locID = getLocID(alert.location.x, alert.location.y);
    const locationDoc = admin.firestore().collection("locations").doc(locID);
    const location = await locationDoc.get();
    if (location.exists) {
      const data: { userIDs: string[]; alerts: string[] } =
        location.data() as any;
      data.alerts.unshift(alert.id);
      await locationDoc.update({ alerts: data.alerts });
      if (data.userIDs.length) {
        await Promise.all(
          data.userIDs.map((userID) => testAndNotifyUser(userID, alert))
        );
      }
    } else {
      await locationDoc.create({ alerts: [alert.id] });
    }
  }
}
