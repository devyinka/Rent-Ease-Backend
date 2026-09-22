import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { tenantController } from "../controllers/tenant.controller.js";

const router = Router();

router.get("/tenants/me", requireRole("TENANT"), tenantController.getMyProfile);

router.patch(
  "/tenants/me",
  requireRole("TENANT"),
  tenantController.updateMyProfile,
);

router.get("/tenants", requireRole("LANDLORD"), tenantController.getAll);

router.get(
  "/tenants/:id",
  requireRole("LANDLORD", "TENANT"),
  tenantController.getById,
);

router.patch("/tenants/:id", requireRole("TENANT"), tenantController.update);

export default router;
