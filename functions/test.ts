import { doWazeFetch } from "./src/scrape";
import fs from "fs";
import path from "path";
doWazeFetch({
  topLeft: {
    x: -73.7689888478918,
    y: 40.5739187257924,
  },
  bottomRight: { x: -73.4166800752515, y: 40.9212490867493 },
}).then((res) => {
  fs.writeFileSync(
    path.join(__dirname, "alerts.json"),
    JSON.stringify(res, null, 2)
  );
});
