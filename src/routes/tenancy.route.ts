import { Router } from "express";
import { z } from "zod";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { tenancyController } from "../controllers/tenancy.controller.js";

const uuidSchema = z.string().uuid("Must be a valid UUID");
const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount");
const dateSchema = z.string().datetime({ offset: true });

export const tenancyCreateSchema = z
  .object({
    tenantId: uuidSchema,
    unitId: uuidSchema,
    startDate: dateSchema,
    endDate: dateSchema.optional(),
    status: z.enum(["PENDING", "ACTIVE"]).optional(),
    rentAmount: moneySchema.optional(),
    rentFrequency: z
      .enum(["MONTHLY", "QUARTERLY", "BI_ANNUAL", "ANNUAL", "CUSTOM"])
      .optional(),
    depositAmount: moneySchema.optional(),
    serviceCharge: moneySchema.optional(),
  })
  .strict();

export const tenancyUpdateSchema = tenancyCreateSchema
  .omit({ tenantId: true, unitId: true, status: true })
  .partial();

const router = Router();

router.get(
  "/tenancies/me",
  requireRole("TENANT"),
  tenancyController.getMyTenancies,
);

router.post("/tenancies", requireRole("LANDLORD"), tenancyController.create);

router.get(
  "/tenancies/:id",
  requireRole("LANDLORD", "AGENT", "TENANT"),
  tenancyController.getById,
);

router.patch(
  "/tenancies/:id",
  requireRole("LANDLORD", "AGENT"),
  tenancyController.update,
);

router.patch(
  "/tenancies/:id/activate",
  requireRole("LANDLORD", "AGENT"),
  tenancyController.activate,
);

// router.post(
//   "/tenancies/:id/end",
//   requireRole("LANDLORD"),
//   tenancyController.end,
// );

export default router;
