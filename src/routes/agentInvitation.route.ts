import { Router } from "express";
import { z } from "zod";

import { agentInvitationController } from "../controllers/agentInvitation.controller.js";

import { requireRole } from "../auth/auth.MiddleWare.js";
const router = Router();

export const agentInvitationSchema = z
  .object({
    email: z.string().trim().email().toLowerCase().optional(),
    phone: z.string().trim().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.email || value.phone), {
    message: "Email or phone is required",
  });

// CREATE AGENT INVITATION
router.post(
  "/",
  requireRole("LANDLORD"),
  agentInvitationController.createInvitation,
);

// GET MY INVITATIONS
router.get(
  "/",
  requireRole("AGENT"),
  agentInvitationController.getMyInvitations,
);

// GET INVITATION BY TOKEN
router.get("/:token", agentInvitationController.getInvitationByToken);

// ACCEPT AGENT INVITATION
router.post(
  "/:invitationId/accept",
  requireRole("AGENT"),
  agentInvitationController.acceptInvitation,
);

// DECLINE AGENT INVITATION
router.post(
  "/:invitationId/decline",
  requireRole("AGENT"),
  agentInvitationController.declineInvitation,
);

// CANCEL AGENT INVITATION
router.post(
  "/:invitationId/cancel",
  requireRole("LANDLORD"),
  agentInvitationController.cancelInvitation,
);

export default router;
