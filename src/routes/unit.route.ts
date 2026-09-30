import { Router } from "express";
import { z } from "zod";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { requirePropertyPermission } from "../middleware/property-access.middleware.js";
import { unitController } from "../controllers/unit.controller.js";

export const unitCreateSchema = z
  .object({
    unitNumber: z.string().trim().min(1).max(50),
    unitType: z.enum([
      "FLAT",
      "APARTMENT",
      "DUPLEX",
      "ROOM",
      "SHOP",
      "OFFICE",
      "OTHER",
    ]),
    floor: z.number().int().optional(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    rentAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
    rentFrequency: z.enum([
      "MONTHLY",
      "QUARTERLY",
      "BI_ANNUAL",
      "ANNUAL",
      "CUSTOM",
    ]),
    serviceCharge: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount")
      .optional(),
    depositAmount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount")
      .optional(),
    notes: z.string().trim().optional(),
  })
  .strict();

export const unitUpdateSchema = unitCreateSchema.partial();

const router = Router();

router.post(
  "/properties/:propertyId/units",
  requireRole("LANDLORD", "AGENT"),
  requirePropertyPermission("MANAGE_UNITS"),
  unitController.create,
);

router.get(
  "/properties/:propertyId/units",
  requireRole("LANDLORD", "AGENT"),
  requirePropertyPermission("VIEW_UNITS"),
  unitController.getAll,
);

router.get("/:id", requireRole("LANDLORD", "AGENT"), unitController.getById);

router.patch("/:id", requireRole("LANDLORD", "AGENT"), unitController.update);

router.delete("/:id", requireRole("LANDLORD", "AGENT"), unitController.delete);

export default router;
