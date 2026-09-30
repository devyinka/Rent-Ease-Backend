import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../auth/auth.MiddleWare.js";
import { requireRole } from "../auth/auth.MiddleWare.js";
import { agentCompensationController } from "../controllers/agentCompensetation.controller.js";

const router = Router();

export const compensationSchema = z
  .object({
    type: z.enum(["FIXED", "PERCENTAGE"]),
    value: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
    frequency: z.enum([
      "ONE_TIME",
      "MONTHLY",
      "QUARTERLY",
      "BI_ANNUAL",
      "ANNUAL",
      "PER_COLLECTION",
    ]),
    effectiveFrom: z.coerce.date(),
    effectiveTo: z.coerce.date().optional(),
  })
  .strict();

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
