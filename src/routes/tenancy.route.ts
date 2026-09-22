import { Router } from "express";

import { requireRole } from "../auth/auth.MiddleWare.js";
import { tenancyController } from "../controllers/tenancy.controller.js";

const router = Router();

router.post("/tenancies", requireRole("LANDLORD"), tenancyController.create);

router.get(
  "/tenancies/:id",
  requireRole("LANDLORD", "TENANT"),
  tenancyController.getById,
);

router.patch(
  "/tenancies/:id",
  requireRole("LANDLORD"),
  tenancyController.update,
);

router.patch(
  "/tenancies/:id/activate",
  requireRole("LANDLORD"),
  tenancyController.activate,
);

// router.post(
//   "/tenancies/:id/end",
//   requireRole("LANDLORD"),
//   tenancyController.end,
// );

export default router;
