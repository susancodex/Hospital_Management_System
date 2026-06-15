import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { setupWebSocket } from "./lib/ws";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const server = createServer(app);
setupWebSocket(server);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
  logger.info("WebSocket server active on /ws");
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
