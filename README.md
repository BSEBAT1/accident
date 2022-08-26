# BB Accident Firebase Functions

You can execute cloud functions using the Firebase functions SDK. [ Docs here ](https://firebase.google.com/docs/functions/callable#call_the_function)

Store a users FCM Token, subscribe to a location region, and receive push notifications for accidents in that region.

## Accident Type

```ts
export type WazeAlert = {
  country: string;
  nThumbsUp: number;
  city: string;
  reportRating: number;
  reliability: number;
  type: string;
  uuid: string;
  speed: number;
  reportMood: number;
  subtype: string;
  street: string;
  additionalInfo: string;
  id: string;
  nComments: number;
  inscale: boolean;
  comments: {}[];
  isJamUnifiedAlert: boolean;
  confidence: number;
  nImages: number;
  roadType: number;
  magvar: number;
  showFacebookPic: boolean;
  wazeData: string;
  location: { x: number; y: number };
  pubMillis: number;
};
```

## Endpoints

### subscribeToLocation

Subscribes a user to alerts at a location. The user will receive push notifications for any accidents in the area if their FCM Token is stored at users.[uid].device.fcmToken

Call with

```kotlin
functions
        .getHttpsCallable("subscribeToLocation")
        .call(data)
```

Input data

```ts
export type SubscribeToLocation = {
  location: {
    x: number; // latitude,
    y: number; // longitude
  };
  radius: number; // 5 - 50 MILES
};
```

Response: `void`

### unsubcribeToLocation

Removes a user from all location updates

Call with

```kotlin
functions
        .getHttpsCallable("unsubscribeToLocation")
        .call()
```

Input data: `void`
Response: `void`

### queryAlertsByLocation

Get accidents sorted by timestamp decending at any location

Call with

```kotlin
functions
        .getHttpsCallable("queryAlertsByLocation")
        .call(data)
```

Input data:

```ts
type QueryAccidents = {
  location: {
    x: number; // latitude
    y: number; // longitude
  };
  radius: number;
  limit?: number;
  offset?: number;
};
```

Response: `WazeAlert[]`

## Notification Payload

```ts
type AccidentNotification = {
  alertJSON: string;
};

type AlertJSON = Pick<
  WazeAlert,
  | "id"
  | "location"
  | "city"
  | "street"
  | "severity"
  | "pubMillis"
  | "reportRating"
  | "reliability"
>;
```

## Firestore Collections

### User

Store the user's FCM Token here

```ts
firestore.collection("users");

type User = {
  notifications: string[]; // Alert ID's, most recent first
  device?: {
    fcmToken: string;
    os: "ios" | "android";
  };
  subscribedTo?: string[]; // Location ID's
};
```

### Alerts

The accidents table

```ts
firestore.collection("alerts");

type Alert = WazeAlert;
```

### Locations

A geo location grid

```ts
firestore.collection("locations");

type Location = {
  userIDs: string[]; // Users subscribed to this location
  alerts: string[]; // Alerts at this location, most recent first
};
```

### Waze Regions

The regions that Waze is queried for every run of the scrape cron job

```ts
firestore.collection("waze-regions");

type WazeRegion = {
  topLeft: {
    x: number; // Latitude
    y: number; // Longitude
  };
  bottomRight: {
    x: number; // Latitude
    y: number; // Longitude
  };
};
```
