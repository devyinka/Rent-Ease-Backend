import { Router } from "express";
import { z } from "zod";

import { requireRole } from "../auth/auth.MiddleWare.js";

import { requirePropertyPermission } from "../middleware/property-access.middleware.js";
import { propertyController } from "../controllers/property.controller.js";

export const propertyCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    address: z.string().trim().min(1),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    country: z.string().trim().min(1).max(100).optional(),
    imageUrl: z.string().trim().url().optional(),
    description: z.string().trim().optional(),
  })
  .strict();

export const propertyUpdateSchema = propertyCreateSchema.partial();

const router = Router();

router.post("/", requireRole("LANDLORD"), propertyController.create);

router.get("/", requireRole("LANDLORD"), propertyController.getAll);

router.get(
  "/:propertyId",
  requireRole("LANDLORD", "AGENT"),
  requirePropertyPermission("VIEW_PROPERTY"),
  propertyController.getById,
);

router.patch(
  "/:propertyId",
  requireRole("LANDLORD", "AGENT"),
  requirePropertyPermission("MANAGE_PROPERTY"),
  propertyController.update,
);

router.delete(
  "/:propertyId",
  requireRole("LANDLORD", "AGENT"),
  requirePropertyPermission("MANAGE_PROPERTY"),
  propertyController.delete,
);

export default router;
