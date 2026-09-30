import { Router } from "express";
import { z } from "zod";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { requirePropertyPermission } from "../middleware/property-access.middleware.js";
import { requireTechnicianWorkOrderAccess } from "../middleware/technician-work-order-access.middleware.js";
import { workOrderController } from "../controllers/workOrder.controller.js";
import { workOrderService } from "../services/workOrder.service.js";

const uuidSchema = z.string().uuid("Must be a valid UUID");

export const createWorkOrderSchema = z
  .object({
    unitId: uuidSchema.optional(),
    technicianId: uuidSchema.optional(),
    title: z.string().trim().min(1).max(150),
    description: z.string().trim().optional(),
  })
  .strict();

export const updateWorkOrderStatusSchema = z
  .object({
    status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  })
  .strict();

const requireAssignedTechnician = requireTechnicianWorkOrderAccess(
  workOrderService.hasWorkOrderAccess,
);

const router = Router();

router.post(
  "/properties/:propertyId/work-orders",
  requireRole("LANDLORD", "AGENT"),
  requirePropertyPermission("MANAGE_MAINTENANCE"),
  workOrderController.create,
);

router.get(
  "/properties/:propertyId/work-orders",
  requireRole("LANDLORD", "AGENT"),
  requirePropertyPermission("MANAGE_MAINTENANCE"),
  workOrderController.getForProperty,
);

router.get(
  "/work-orders",
  requireRole("TECHNICIAN"),
  workOrderController.getMine,
);

router.get(
  "/work-orders/:workOrderId",
  requireRole("TECHNICIAN"),
  requireAssignedTechnician,
  workOrderController.getById,
);

router.patch(
  "/work-orders/:workOrderId",
  requireRole("TECHNICIAN"),
  requireAssignedTechnician,
  workOrderController.updateStatus,
);

export default router;
