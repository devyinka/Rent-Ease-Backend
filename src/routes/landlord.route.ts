import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";

import { landlordController } from "../controllers/landlord.controller.js";

const router = Router();

// ASSIGN PROPERTY TO AGENT
router.post(
  "/properties",
  requireRole("LANDLORD"),
  landlordController.assignProperty,
);

// GET AGENT PROPERTIES
router.get(
  "/:landlordAgentId/properties",
  requireRole("LANDLORD"),
  landlordController.getAgentProperties,
);

// REMOVE PROPERTY FROM AGENT
router.delete(
  "/properties/:agentPropertyId",
  requireRole("LANDLORD"),
  landlordController.removeProperty,
);

router.get(
  "/:agentPropertyId",
  requireRole("LANDLORD"),
  landlordController.getPermissions,
);

// SET ALL PERMISSIONS
router.put(
  "/:agentPropertyId",
  requireRole("LANDLORD"),
  landlordController.setPermissions,
);

// GRANT PERMISSION
router.post(
  "/:agentPropertyId",
  requireRole("LANDLORD"),
  landlordController.grantPermission,
);

// REVOKE PERMISSION
router.delete(
  "/:agentPropertyId/:permission",
  requireRole("LANDLORD"),
  landlordController.revokePermission,
);

export default router;
