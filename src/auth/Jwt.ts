import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";

import { env } from "../config/env.js";

import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.type.js";

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  sid: z.string().min(1),
  role: z.enum(["LANDLORD", "AGENT", "TENANT", "TECHNICIAN"]),
});

const refreshTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  sid: z.string().min(1),
});

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  };

  return jwt.sign(payload, env.jwtAccessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  // Pin the algorithm, issuer, and audience before accepting claims from the token.
  const payload = jwt.verify(token, env.jwtAccessSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    algorithms: ["HS256"],
  });

  return accessTokenPayloadSchema.parse(payload) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions["expiresIn"],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  };

  return jwt.sign(payload, env.jwtRefreshSecret, options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.jwtRefreshSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    algorithms: ["HS256"],
  });

  return refreshTokenPayloadSchema.parse(payload) as RefreshTokenPayload;
}
