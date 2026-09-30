import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";
import {
  requireAgentPermission,
  requireAgentPropertyAccess,
} from "../middleware/property-access.middleware.js";

import { agentController } from "../controllers/agent.controller.js";

const router = Router();

// PROFILE
router.get("/me", requireRole("AGENT"), agentController.getMyProfile);

router.patch("/me", requireRole("AGENT"), agentController.updateMyProfile);

// LANDLORDS
router.get("/landlords", requireRole("AGENT"), agentController.getMyLandlords);

router.get(
  "/landlords/:relationshipId",
  requireRole("AGENT"),
  agentController.getLandlordRelationship,
);

// PROPERTIES
router.get(
  "/properties",
  requireRole("AGENT"),
  agentController.getMyProperties,
);

router.get(
  "/properties/:agentPropertyId",
  requireRole("AGENT"),
  requireAgentPropertyAccess,
  agentController.getMyProperty,
);

router.get(
  "/properties/:agentPropertyId/permissions",
  requireRole("AGENT"),
  requireAgentPropertyAccess,
  agentController.getMyPropertyPermissions,
);

router.get(
  "/properties/:agentPropertyId/access",
  requireRole("AGENT"),
  requireAgentPropertyAccess,
  requireAgentPermission("VIEW_PROPERTY"),
  agentController.getMyPropertyAccess,
);

export default router;
