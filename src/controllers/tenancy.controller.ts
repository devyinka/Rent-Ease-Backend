import type { Request, Response } from "express";

import { tenancyService } from "../services/tenancy.service.js";
import type {
  CreateTenancyInput,
  UpdateTenancyInput,
} from "../types/tenancy.type.js";
import {
  tenancyCreateSchema,
  tenancyUpdateSchema,
} from "../routes/tenancy.route.js";

export const tenancyController = {
  getMyTenancies: async (req: Request, res: Response) => {
    const tenancies = await tenancyService.getMyTenancies(req.user!.id);

    res.status(200).json({
      success: true,
      data: tenancies,
    });
  },

  create: async (req: Request, res: Response) => {
    const tenancy = await tenancyService.createTenancy(
      req.user!.id,
      tenancyCreateSchema.parse(req.body) as CreateTenancyInput,
    );

    res.status(201).json({
      success: true,
      data: tenancy,
    });
  },

  getById: async (req: Request, res: Response) => {
    const tenancyId = req.params.id;

    const tenancy = await tenancyService.getTenancyById(
      req.user!.id,
      tenancyId as string,
    );

    res.status(200).json({
      success: true,
      data: tenancy,
    });
  },

  update: async (req: Request, res: Response) => {
    const tenancyId = req.params.id;

    const tenancy = await tenancyService.updateTenancy(
      req.user!.id,
      tenancyId as string,
      tenancyUpdateSchema.parse(req.body) as UpdateTenancyInput,
    );

    res.status(200).json({
      success: true,
      data: tenancy,
    });
  },

  activate: async (req: Request, res: Response) => {
    const tenancyId = req.params.id;

    const tenancy = await tenancyService.activateTenancy(
      req.user!.id,
      tenancyId as string,
    );

    res.status(200).json({
      success: true,
      data: tenancy,
    });
  },

  //   end: async (req: Request, res: Response) => {
  //     const tenancyId = req.params.id;

  //     const tenancy = await tenancyService.endTenancy(
  //       req.user!.id,
  //       tenancyId as string,
  //       req.body?.moveOutReason,
  //     );

  //     res.status(200).json({
  //       success: true,
  //       data: tenancy,
  //     });
  //   },
};
