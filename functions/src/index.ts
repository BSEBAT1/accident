import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getLocIDsforLocationSetting } from "./getLocIDsForLocationSetting";
import { processAlerts } from "./processAlerts";
import { BoundingBox, doWazeFetch } from "./scrape";
import geolib from "geolib";
import { compact, flatten } from "lodash";
import { WazeAlert } from "./locations";
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
  .schedule("every 1 second")
  .onRun(async () => {
    const boxes = await admin
      .firestore()
      .collection("waze-regions")
      .listDocuments();
    await Promise.all(
      boxes.map(async (boxRef) => {
        const doc = await boxRef.get();
        const box: BoundingBox = doc.data() as any;
        if (box) {
          try {
            const alerts = await doWazeFetch(box);
            await processAlerts(alerts);
          } catch (err) {
            console.error(err);
          }
        }
      })
    );
  });

export const subscribeToLocation = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) return;
    const uid = context.auth.uid;
    const userDoc = admin.firestore().collection("users").doc(uid);
    const user = await userDoc.get();
    const userData = user.data() as any;
    if (userData.subscribedTo) {
      await Promise.all(
        userData.subscribedTo.map(async (locID: string) => {
          return admin
            .firestore()
            .collection("locations")
            .doc(locID)
            .update({ userIDs: admin.firestore.FieldValue.arrayRemove(uid) });
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
          .update({ userIDs: admin.firestore.FieldValue.arrayUnion(uid) });
      })
    );
    await userDoc.update({ subscribedTo: locIDs });
    const primaryDoc = admin
      .firestore()
      .collection("waze-regions")
      .doc("primary");
    const primary = await primaryDoc.get();
    if (!primary.exists) {
      await primaryDoc.create({ ...box, boxes: { [uid]: box } });
    } else {
      const data = primary.data();
      if (data) {
        data.boxes[uid] = box;
        const boxes: BoundingBox[] = Object.values(data.boxes);
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
        await primaryDoc.update({ ...primaryBox, boxes: data.boxes });
      }
    }
  }
);

export const queryAlertsByLocation = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) return [];
    if (!data.location || !data.radius) return [];
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
            const data: WazeAlert[] = await (location
              .data()
              ?.alerts?.slice(offset, offset + limit)
              .map(async (alertID: string) => {
                const alert = await admin
                  .firestore()
                  .collection("alerts")
                  .doc(alertID)
                  .get();
                return alert.data() as WazeAlert;
              }) ?? Promise.resolve([]));
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
