import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";

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
  agentController.getMyProperty,
);

router.get(
  "/properties/:agentPropertyId/permissions",
  requireRole("AGENT"),
  agentController.getMyPropertyPermissions,
);

router.get(
  "/properties/:agentPropertyId/access",
  requireRole("AGENT"),
  agentController.getMyPropertyAccess,
);

export default router;
