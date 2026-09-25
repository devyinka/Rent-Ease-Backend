import { Router } from "express";
import { requireRole } from "../auth/auth.MiddleWare";
import { tenantInvitationController } from "../controllers/tenantInvitation.controller";

const TenantinvitationByToken = Router();
TenantinvitationByToken.post(
  "/accept-tenant-invitation-by-token/:token",
  requireRole("TENANT"),
  tenantInvitationController.getInvitationByToken,
);

export default TenantinvitationByToken;
