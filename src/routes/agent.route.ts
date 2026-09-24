import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { agentController } from "../controllers/agent.controller.js";

const router = Router();

router.get("/me", requireRole("AGENT"), agentController.getMyProfile);

router.patch("/me", requireRole("AGENT"), agentController.updateMyProfile);

router.get("/landlords", requireRole("AGENT"), agentController.getMyLandlords);

router.get(
  "/landlords/:relationshipId",
  requireRole("AGENT"),
  agentController.getLandlordRelationship,
);

router.patch(
  "/landlords/:relationshipId/accept",
  requireRole("AGENT"),
  agentController.acceptRelationship,
);

router.patch(
  "/landlords/:relationshipId/revoke",
  requireRole("AGENT"),
  agentController.revokeRelationship,
);

export default router;
