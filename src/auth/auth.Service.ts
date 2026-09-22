import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";

import {
  authSessions,
  tenantInvitations,
  tenants,
  users,
  landlords,
} from "../db/schema.js";

import { hashPassword, verifyPassword } from "./password.js";

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./Jwt.js";

import type { LoginInput, RegisterInput } from "./auth.type.js";

import crypto from "node:crypto";

import { env } from "../config/env.js";

import { AppError } from "../errors/appError.js";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

function calculateExpiryDate(duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error("Invalid token expiry format");
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + amount * multipliers[unit]);
}

function sanitizeUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
export const authService = {
  createSession: async (user: typeof users.$inferSelect) => {
    const sessionId = generateSessionId();

    const accessToken = signAccessToken({
      sub: user.id,
      sid: sessionId,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      sid: sessionId,
    });

    await db.insert(authSessions).values({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      status: "ACTIVE",
      expiresAt: calculateExpiryDate(env.jwtRefreshExpiresIn),
    });

    return {
      accessToken,
      refreshToken,
    };
  },

  registerUser: async (input: RegisterInput) => {
    const email = input.email?.trim().toLowerCase() ?? null;
    const phone = input.phone?.trim() ?? null;

    if (email) {
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmail) {
        throw new AppError("An account with this email already exists", 409);
      }
    }

    if (phone) {
      const existingPhone = await db.query.users.findFirst({
        where: eq(users.phone, phone),
      });

      if (existingPhone) {
        throw new AppError("An account with this phone already exists", 409);
      }
    }

    if (input.invitationToken && input.role !== "TENANT") {
      throw new AppError(
        "Invitation token can only be used when registering as a tenant",
        400,
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await db.transaction(async (transaction) => {
      let invitation = null;

      if (input.invitationToken) {
        const tokenHash = hashToken(input.invitationToken);

        invitation = await transaction.query.tenantInvitations.findFirst({
          where: eq(tenantInvitations.tokenHash, tokenHash),
        });

        if (!invitation) {
          throw new AppError("Invalid invitation token", 400);
        }

        if (invitation.status !== "PENDING") {
          throw new AppError("This invitation is no longer available", 400);
        }

        if (invitation.expiresAt < new Date()) {
          await transaction
            .update(tenantInvitations)
            .set({
              status: "EXPIRED",
              updatedAt: new Date(),
            })
            .where(eq(tenantInvitations.id, invitation.id));

          throw new AppError("This invitation has expired", 400);
        }

        const emailMatches =
          invitation.email && email && invitation.email.toLowerCase() === email;

        const phoneMatches =
          invitation.phone && phone && invitation.phone === phone;

        if (!emailMatches && !phoneMatches) {
          throw new AppError(
            "Your email or phone does not match the invitation",
            403,
          );
        }
      }

      const [createdUser] = await transaction
        .insert(users)
        .values({
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email,
          phone,
          passwordHash,
          role: input.role,
          status: "ACTIVE",
        })
        .returning();

      if (!createdUser) {
        throw new AppError("Failed to create user", 500);
      }

      if (input.role === "LANDLORD") {
        const [landlord] = await transaction
          .insert(landlords)
          .values({
            userId: createdUser.id,
          })
          .returning();

        if (!landlord) {
          throw new AppError("Failed to create landlord profile", 500);
        }
      }

      if (input.role === "TENANT") {
        const [tenant] = await transaction
          .insert(tenants)
          .values({
            userId: createdUser.id,
          })
          .returning();

        if (!tenant) {
          throw new AppError("Failed to create tenant profile", 500);
        }
      }

      if (invitation) {
        await transaction
          .update(tenantInvitations)
          .set({
            status: "ACCEPTED",
            acceptedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(tenantInvitations.id, invitation.id));
      }

      return createdUser;
    });

    const tokens = await authService.createSession(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  loginUser: async (input: LoginInput) => {
    const identifier = input.identifier.trim();

    const user = identifier.includes("@")
      ? await db.query.users.findFirst({
          where: eq(users.email, identifier.toLowerCase()),
        })
      : await db.query.users.findFirst({
          where: eq(users.phone, identifier),
        });

    if (!user || !user.passwordHash) {
      throw new AppError("Invalid credentials", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("This account is not active", 403);
    }

    const validPassword = await verifyPassword(
      user.passwordHash,
      input.password,
    );

    if (!validPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    const tokens = await authService.createSession(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  refreshSession: async (refreshToken: string) => {
    const payload = verifyRefreshToken(refreshToken);

    const session = await db.query.authSessions.findFirst({
      where: and(
        eq(authSessions.id, payload.sid),
        eq(authSessions.userId, payload.sub),
      ),
    });

    if (!session) {
      throw new AppError("Session not found", 401);
    }

    if (session.status !== "ACTIVE") {
      throw new AppError("Session is no longer active", 401);
    }

    if (session.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", 401);
    }

    if (hashToken(refreshToken) !== session.refreshTokenHash) {
      await db
        .update(authSessions)
        .set({
          status: "REVOKED",
          revokedAt: new Date(),
        })
        .where(eq(authSessions.id, session.id));

      throw new AppError("Invalid refresh token", 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user || user.status !== "ACTIVE") {
      throw new AppError("User is not active", 401);
    }

    const newRefreshToken = signRefreshToken({
      sub: user.id,
      sid: session.id,
    });

    const newAccessToken = signAccessToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });

    await db
      .update(authSessions)
      .set({
        refreshTokenHash: hashToken(newRefreshToken),
        lastUsedAt: new Date(),
      })
      .where(eq(authSessions.id, session.id));

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  logoutSession: async (sessionId: string) => {
    await db
      .update(authSessions)
      .set({
        status: "REVOKED",
        revokedAt: new Date(),
      })
      .where(eq(authSessions.id, sessionId));
  },
};
