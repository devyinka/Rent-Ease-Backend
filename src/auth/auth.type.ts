import type { userRoleEnum } from "../db/schema.js";

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type AccessTokenPayload = {
  sub: string;
  sid: string;
  role: UserRole;
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
  invitationToken?: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type AuthenticatedUser = {
  id: string;
  sessionId: string;
  role: UserRole;
};
