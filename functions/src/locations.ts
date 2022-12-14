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
  location: {
    x: number; // LONGITUDE
    y: number; // LATITUDE
  };
  pubMillis: number;
};
