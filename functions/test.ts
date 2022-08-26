import { doWazeFetch } from "./src/scrape";
import fs from "fs";
import path from "path";
doWazeFetch({
  topLeft: {
    // x: -73.7689888478918,
    // y: 40.5739187257924,
    x: 47.731365,
    y: -125.281445,
    // x: 45.567374,
    // y: -122.786174,
  },
  bottomRight: {
    // x: 45.390198,
    // y: -122.521129,
    x: 28.119692,
    y: -76.23848,
  },
  // bottomRight: { x: -73.4166800752515, y: 40.9212490867493 },
}).then((res) => {
  fs.writeFileSync(
    path.join(__dirname, "alerts.json"),
    JSON.stringify(res, null, 2)
  );
});
