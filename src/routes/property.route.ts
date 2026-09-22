import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";

import { requirePropertyOwner } from "../middleware/property-access.middleware.js";

import { propertyController } from "../controllers/property.controller.js";

const router = Router();

router.post("/", requireRole("LANDLORD"), propertyController.create);

router.get("/", requireRole("LANDLORD"), propertyController.getAll);

router.get("/:propertyId", requirePropertyOwner, propertyController.getById);

router.patch("/:propertyId", requirePropertyOwner, propertyController.update);

router.delete("/:propertyId", requirePropertyOwner, propertyController.delete);

export default router;
