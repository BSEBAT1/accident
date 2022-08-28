export type Region = {
  location: {
    x: number; // latitude
    y: number; // longitude
  };
  radius: number; // miles
};

export type User = {
  subscriptionValid?: boolean;
  subscribedTo?: string[]; // Location ID's
  locationSubscription?: Region;
  notifications: string[]; /// Accident ID's Sent To This User;
  device?: {
    os: "ios" | "android";
    fcmToken?: string;
  };
};
