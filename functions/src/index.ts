import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getLocIDsforLocationSetting } from "./getLocIDsForLocationSetting";
import { processAlerts } from "./processAlerts";
import { BoundingBox, doWazeFetch, Point } from "./scrape";
import * as geolib from "geolib";
import { compact, flatten } from "lodash";
import { WazeAlert } from "./locations";
import { validateLocation } from "./validate";
admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// query bottom={}&left={}&ma=500&mu=0&right={}&top={}
export const fetchWaze = functions.pubsub
  .schedule("* * * * *")
  .onRun(async () => {
    const tstart = Date.now();
    while (Date.now() - tstart < 59000) {
      const t2 = Date.now();
      await _fetchWaze();
      console.log("Executed Waze");
      if (Date.now() - t2 < 1000) {
        await delay(Date.now() - t2);
      }
    }
  });

const delay = (time: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, time);
  });
};

const _fetchWaze = async () => {
  const boxes = await admin
    .firestore()
    .collection("waze-regions")
    .listDocuments();
  await Promise.all(
    boxes.map(async (boxRef) => {
      const doc = await boxRef.get();
      const box: BoundingBox = doc.data() as any;
      if (box) {
        const alerts = await doWazeFetch(box);
        if (!alerts) throw new Error("No data received from Waze");
        await processAlerts(alerts);
      }
    })
  );
};

export const unsubscribeToLocation = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) return;
    const uid = context.auth.uid;
    const userDoc = admin.firestore().collection("users").doc(uid);
    const user = await userDoc.get();
    const userData = user.data() as any;
    if (userData?.subscribedTo?.length) {
      await Promise.all(
        userData.subscribedTo.map(async (locID: string) => {
          return admin
            .firestore()
            .collection("locations")
            .doc(locID)
            .set(
              { userIDs: admin.firestore.FieldValue.arrayRemove(uid) },
              { merge: true }
            );
        })
      );
      await userDoc.set(
        {
          subscribedTo: admin.firestore.FieldValue.delete(),
          locationSubscription: admin.firestore.FieldValue.delete(),
        },
        { merge: true }
      );
    }
    await updatePrimary((doc) => delete doc.boxes[uid]);
  }
);

export type SubscribeToLocation = {
  location: Point;
  radius: number; // 5 - 50 mi
};

export const subscribeToLocation = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) return;
    validateLocation(data.location);
    const uid = context.auth.uid;
    const userDoc = admin.firestore().collection("users").doc(uid);
    const user = await userDoc.get();
    const userData = user.data() as any;
    if (userData?.subscribedTo?.length) {
      await Promise.all(
        userData.subscribedTo.map(async (locID: string) => {
          return admin
            .firestore()
            .collection("locations")
            .doc(locID)
            .set(
              { userIDs: admin.firestore.FieldValue.arrayRemove(uid) },
              { merge: true }
            );
        })
      );
    }
    const { locIDs, box } = getLocIDsforLocationSetting(
      data.location,
      data.radius
    );
    await Promise.all(
      locIDs.map(async (locID) => {
        return admin
          .firestore()
          .collection("locations")
          .doc(locID)
          .set(
            { userIDs: admin.firestore.FieldValue.arrayUnion(uid) },
            { merge: true }
          );
      })
    );
    await userDoc.set(
      { subscribedTo: locIDs, locationSubscription: data },
      { merge: true }
    );
    await updatePrimary((doc) => (doc.boxes[uid] = box));
  }
);

async function updatePrimary(updateDoc: (doc: any) => void) {
  const primaryDoc = admin
    .firestore()
    .collection("waze-regions")
    .doc("primary");
  let primary = (await primaryDoc.get()).data();
  if (!primary) {
    primary = { boxes: {} };
  }
  updateDoc(primary);
  const boxes: BoundingBox[] = Object.values(primary.boxes);
  const points: { latitude: number; longitude: number }[] = [];
  boxes.forEach((box: BoundingBox) => {
    points.push(
      { latitude: box.topLeft.x, longitude: box.topLeft.y },
      { latitude: box.bottomRight.x, longitude: box.bottomRight.y }
    );
  });
  const bounds = geolib.getBounds(points);
  const primaryBox = {
    topLeft: { x: bounds.minLat, y: bounds.minLng },
    bottomRight: { x: bounds.maxLat, y: bounds.maxLng },
  };
  await primaryDoc.set(
    { ...primaryBox, boxes: primary.boxes },
    { merge: true }
  );
}

export type QueryAccidents = {
  location: Point;
  radius: number;
  limit?: number;
  offset?: number;
};

export const queryAccidentsByLocation = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) return [];
    if (!data.location || !data.radius) return [];
    validateLocation(data.location);
    const { limit = 5, offset = 0 } = data;
    const { locIDs } = getLocIDsforLocationSetting(data.location, data.radius);
    const fetched = flatten(
      await Promise.all(
        locIDs.map(async (locID) => {
          const location = await admin
            .firestore()
            .collection("locations")
            .doc(locID)
            .get();
          if (location.exists) {
            const data: WazeAlert[] = await Promise.all(
              location
                .data()
                ?.accidents?.slice(
                  Math.floor(offset / 2 / locIDs.length),
                  offset + limit
                )
                .map(async (accidentID: string) => {
                  const accident = await admin
                    .firestore()
                    .collection("accidents")
                    .doc(accidentID)
                    .get();
                  return accident.data() as WazeAlert;
                }) ?? []
            );
            return compact(data);
          } else {
            return [];
          }
        })
      )
    );
    fetched.sort((a, b) => a.pubMillis - b.pubMillis);
    return fetched;
  }
);
