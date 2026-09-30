import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { authSessions, users } from "../db/schema.js";
import { verifyAccessToken } from "../auth/Jwt.js";
import { env } from "../config/env.js";
import { agentService } from "../services/agent.service.js";
import { propertyAccessService } from "../services/property-access.service.js";
import { socketRooms } from "./room.js";

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.allowOrigins.split(",").map((origin) => origin.trim()),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    // Socket handshakes bypass Express middleware, so repeat token and session validation here.
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = verifyAccessToken(token);
      const account = await db
        .select({
          userId: users.id,
          role: users.role,
        })
        .from(users)
        .innerJoin(authSessions, eq(authSessions.userId, users.id))
        .where(
          and(
            eq(users.id, payload.sub),
            eq(authSessions.id, payload.sid),
            eq(users.status, "ACTIVE"),
            eq(authSessions.status, "ACTIVE"),
            gt(authSessions.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!account[0]) {
        return next(new Error("Invalid or expired session"));
      }

      socket.data.user = account[0];
      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.join(socketRooms.user(socket.data.user.userId));

    socket.on("join-property", async (propertyId: string, callback) => {
      // Authorize room membership before subscribing the socket to property events.
      if (typeof propertyId !== "string" || !propertyId) {
        return callback?.({
          success: false,
          message: "Property ID is required",
        });
      }

      const userId = socket.data.user.userId as string;
      const ownsProperty = await propertyAccessService.userOwnsProperty(
        userId,
        propertyId,
      );
      const canAccess =
        ownsProperty ||
        (await agentService.hasPermission(userId, propertyId, "VIEW_PROPERTY"));

      if (!canAccess) {
        return callback?.({
          success: false,
          message: "Property access denied",
        });
      }

      socket.join(socketRooms.property(propertyId));
      callback?.({ success: true });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  return io;
}
