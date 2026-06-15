import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import { logger } from "./logger";

interface AuthenticatedWS extends WebSocket {
  userId?: number;
  role?: string;
  isAlive?: boolean;
}

const connections = new Map<number, Set<AuthenticatedWS>>();
let wss: WebSocketServer | null = null;

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedWS, req) => {
    try {
      const url = new URL(req.url ?? "/", `ws://localhost`);
      const token = url.searchParams.get("token");
      if (!token) { ws.close(1008, "Token required"); return; }

      const secret = process.env.JWT_SECRET || "dev-insecure-secret";
      const payload = jwt.verify(token, secret) as { id: number; role: string };
      ws.userId = payload.id;
      ws.role = payload.role;
      ws.isAlive = true;
    } catch {
      ws.close(1008, "Invalid token");
      return;
    }

    const userId = ws.userId!;
    if (!connections.has(userId)) connections.set(userId, new Set());
    connections.get(userId)!.add(ws);

    logger.debug({ userId, role: ws.role }, "WebSocket client connected");
    ws.send(JSON.stringify({ event: "connected", data: { userId }, timestamp: new Date().toISOString() }));

    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("close", () => {
      const userConns = connections.get(userId);
      if (userConns) {
        userConns.delete(ws);
        if (userConns.size === 0) connections.delete(userId);
      }
      logger.debug({ userId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => logger.error({ err, userId }, "WebSocket error"));
  });

  // Heartbeat to detect dead connections
  const heartbeat = setInterval(() => {
    for (const [userId, userConns] of connections.entries()) {
      for (const ws of userConns) {
        if (!ws.isAlive) { ws.terminate(); userConns.delete(ws); continue; }
        ws.isAlive = false;
        ws.ping();
      }
      if (userConns.size === 0) connections.delete(userId);
    }
  }, 30000);

  wss.on("close", () => clearInterval(heartbeat));
  logger.info("WebSocket server initialized on /ws");
  return wss;
}

export function broadcastToUser(userId: number, event: string, data: unknown) {
  const userConns = connections.get(userId);
  if (!userConns || userConns.size === 0) return;
  const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  for (const ws of userConns) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

export function broadcastToRoles(roles: string[], event: string, data: unknown) {
  const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  for (const [, userConns] of connections) {
    for (const ws of userConns) {
      if (ws.readyState === WebSocket.OPEN && ws.role && roles.includes(ws.role)) {
        ws.send(msg);
      }
    }
  }
}

export function broadcastToAll(event: string, data: unknown) {
  const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  for (const [, userConns] of connections) {
    for (const ws of userConns) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }
}

export function getConnectionStats() {
  let totalConnections = 0;
  for (const [, conns] of connections) totalConnections += conns.size;
  return { activeUsers: connections.size, totalConnections };
}
