import "dotenv/config";
import { createServer } from "node:http";
import { env } from "./config/env.js";

import app from "./app.js";

const PORT = env.port;

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`RentEase API running on http://localhost:${PORT}`);
});
