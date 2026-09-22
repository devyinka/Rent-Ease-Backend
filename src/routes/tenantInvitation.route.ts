import { Router } from "express";
import { z } from "zod";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { tenantInvitationController } from "../controllers/tenantInvitation.controller.js";

const router = Router();

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    "Phone number must be in international format, e.g. +2348012345678",
  );

export const createTenantInvitationSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address")
      .optional(),

    phone: phoneSchema.optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Email or phone is required",
    path: ["email"],
  });

export const acceptTenantInvitationSchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required"),
});

router.post(
  "/tenant-invitations",
  requireRole("LANDLORD"),
  tenantInvitationController.create,
);

router.get(
  "/tenant-invitations",
  requireRole("LANDLORD"),
  tenantInvitationController.getAll,
);

router.post(
  "/tenant-invitations/accept",
  requireRole("TENANT"),
  tenantInvitationController.accept,
);

router.delete(
  "/tenant-invitations/:id",
  requireRole("LANDLORD"),
  tenantInvitationController.cancel,
);

export default router;
