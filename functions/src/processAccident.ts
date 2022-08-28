import * as admin from "firebase-admin";
import { WazeAlert } from "./locations";
import { testAndNotifyUser } from "./testAndNotifyUser";
import { getLocID } from "./getLocID";

export async function processAccident(accident: WazeAlert) {
  const doc = admin.firestore().collection("accidents").doc(accident.uuid);
  const ref = await doc.get();
  if (!ref.exists) {
    console.log("NEW ACCIDENT", accident);
    await doc.create(accident);
    const locID = getLocID(accident.location.y, accident.location.x);
    const locationDoc = admin.firestore().collection("locations").doc(locID);
    const location = await locationDoc.get();
    if (location.exists) {
      const data: { userIDs?: string[]; accidents?: string[] } =
        location.data() as any;
      data.accidents = data.accidents ?? [];
      data.accidents.unshift(accident.uuid);
      await locationDoc.set({ accidents: data.accidents }, { merge: true });
      if (data.userIDs?.length) {
        await Promise.all(
          data.userIDs.map((userID) => testAndNotifyUser(userID, accident))
        );
      }
    } else {
      await locationDoc.create({ accidents: [accident.uuid] });
    }
  }
}
