import { Router } from "express";

import { requireAuth } from "../auth/auth.MiddleWare.js";
import { requireRole } from "../auth/auth.MiddleWare.js";

import { agentCompensationController } from "../controllers/agentCompensetation.controller.js";

const router = Router();

// GET COMPENSATIONS
router.get(
  "/:agentPropertyId",
  requireRole("LANDLORD"),
  agentCompensationController.getCompensations,
);

// CREATE COMPENSATION
router.post(
  "/:agentPropertyId",
  requireRole("LANDLORD"),
  agentCompensationController.createCompensation,
);

// END COMPENSATION
router.patch(
  "/:compensationId/end",
  requireRole("LANDLORD"),
  agentCompensationController.endCompensation,
);

export default router;
