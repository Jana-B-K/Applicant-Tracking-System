import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { resolveUserPermissionsService } from "../services/rbac.service.js";

let ioInstance = null;

// track which user ids currently have an open socket connection
const connectedUsers = new Map();

export const isUserOnline = (userId) => {
  if (!userId) return false;
  return (connectedUsers.get(String(userId)) || 0) > 0;
};

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

const getAllowedOrigins = () => {
  const envAllowedOrigins = String(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
};

export const initAlertsSocket = (server) => {
  if (ioInstance) return ioInstance;

  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        null;

      if (!token) {
        return next(new Error("Unauthorized: token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.id).select(
        "-password -refreshToken -passwordResetTokenHash -passwordResetTokenExpiresAt"
      );

      if (!user || !user.isActive) {
        return next(new Error("Unauthorized"));
      }

      const permissions = await resolveUserPermissionsService({
        role: user.role,
        permissions: user.permissions,
      });

      if (!permissions?.viewDashboard) {
        return next(new Error("Forbidden"));
      }

      socket.data.user = user;
      socket.data.permissions = permissions;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = String(socket.data.user?._id || "");
    if (userId) {
      connectedUsers.set(userId, (connectedUsers.get(userId) || 0) + 1);
      socket.join(`user:${userId}`);
    }
    socket.join("alerts:viewDashboard");

    socket.emit("alerts:connected", {
      success: true,
      connectedAt: new Date().toISOString(),
    });

    socket.on("disconnect", () => {
      if (userId) {
        const currentCount = connectedUsers.get(userId) || 0;
        if (currentCount <= 1) {
          connectedUsers.delete(userId);
        } else {
          connectedUsers.set(userId, currentCount - 1);
        }
      }
    });
  });

  console.log("[AlertsSocket] Initialized");
  return ioInstance;
};

export const emitAlertToDashboardUsers = (payload) => {
  if (!ioInstance) return;
  ioInstance.to("alerts:viewDashboard").emit("alerts:new", payload);
};

export const emitAlertToUser = (userId, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit("alerts:new", payload);
};

export const emitAlertToUsers = (userIds = [], payload) => {
  if (!ioInstance || !Array.isArray(userIds)) return;
  userIds.forEach((uid) => {
    emitAlertToUser(uid, payload);
  });
};

export const emitAlertsRefresh = () => {
  if (!ioInstance) return;
  ioInstance.to("alerts:viewDashboard").emit("alerts:refresh", {
    timestamp: new Date().toISOString(),
  });
};
