import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { requirePropertyOwner } from "../middleware/property-access.middleware.js";
import { unitController } from "../controllers/unit.controller.js";

const router = Router();

router.post(
  "/properties/:propertyId/units",
  requireRole("LANDLORD"),
  requirePropertyOwner,
  unitController.create,
);

router.get(
  "/properties/:propertyId/units",
  requireRole("LANDLORD"),
  requirePropertyOwner,
  unitController.getAll,
);

router.get("/:id", requireRole("LANDLORD"), unitController.getById);

router.patch("/:id", requireRole("LANDLORD"), unitController.update);

router.delete("/:id", requireRole("LANDLORD"), unitController.delete);

export default router;
