import type { Request, Response } from "express";

import { tenantService } from "../services/tenant.service.js";
import type { UpdateTenantInput } from "../types/tenant.type.js";

export const tenantController = {
  getMyProfile: async (req: Request, res: Response) => {
    const tenant = await tenantService.getMyTenant(req.user!.id);

    res.status(200).json({
      success: true,
      data: tenant,
    });
  },

  getAll: async (req: Request, res: Response) => {
    const tenants = await tenantService.getTenantsForLandlord(req.user!.id);

    res.status(200).json({
      success: true,
      data: tenants,
    });
  },

  getById: async (req: Request, res: Response) => {
    const tenant = await tenantService.getTenantById(
      req.user!.id,
      req.params.id as string,
    );

    res.status(200).json({
      success: true,
      data: tenant,
    });
  },

  update: async (req: Request, res: Response) => {
    const tenant = await tenantService.updateTenant(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateTenantInput,
    );

    res.status(200).json({
      success: true,
      data: tenant,
    });
  },

  updateMyProfile: async (req: Request, res: Response) => {
    const tenant = await tenantService.getMyTenant(req.user!.id);

    const updatedTenant = await tenantService.updateTenant(
      req.user!.id,
      tenant.tenant.id,
      req.body as UpdateTenantInput,
    );

    res.status(200).json({
      success: true,
      data: updatedTenant,
    });
  },
};
