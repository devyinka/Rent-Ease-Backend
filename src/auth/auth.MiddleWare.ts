import type { NextFunction, Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";

import { verifyAccessToken } from "./Jwt.js";

import type { AuthenticatedUser, UserRole } from "./auth.type.js";
import { db } from "../db/index.js";
import { authSessions, users } from "../db/schema.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authorization.substring(7);

  try {
    const payload = verifyAccessToken(token);

    // The JWT identifies the session; the database check enforces revocation, expiry, and current account status.
    const account = await db
      .select({
        userId: users.id,
        role: users.role,
        userStatus: users.status,
        sessionStatus: authSessions.status,
      })
      .from(users)
      .innerJoin(authSessions, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(users.id, payload.sub),
          eq(authSessions.id, payload.sid),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    const authenticatedAccount = account[0];

    if (!authenticatedAccount) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    if (
      authenticatedAccount.userStatus !== "ACTIVE" ||
      authenticatedAccount.sessionStatus !== "ACTIVE"
    ) {
      return res.status(401).json({
        success: false,
        message: "User account or session is not active",
      });
    }

    req.user = {
      id: authenticatedAccount.userId,
      sessionId: payload.sid,
      role: authenticatedAccount.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}
