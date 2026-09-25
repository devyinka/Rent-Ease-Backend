import type { Request, Response } from "express";

import { agentCompensationService } from "../services/agentCompensation.service.js";

export const agentCompensationController = {
  // GET AGENT COMPENSATIONS
  getCompensations: async (req: Request, res: Response) => {
    const { agentPropertyId } = req.params;

    const compensations = await agentCompensationService.getCompensations(
      req.user!.id,
      agentPropertyId as string,
    );

    return res.status(200).json({
      success: true,
      data: compensations,
    });
  },

  // CREATE COMPENSATION
  createCompensation: async (req: Request, res: Response) => {
    const { agentPropertyId } = req.params;

    const compensation = await agentCompensationService.createCompensation(
      req.user!.id,
      agentPropertyId as string,
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: compensation,
    });
  },

  // END COMPENSATION
  endCompensation: async (req: Request, res: Response) => {
    const { compensationId } = req.params;

    const compensation = await agentCompensationService.endCompensation(
      req.user!.id,
      compensationId as string,
      req.body,
    );

    return res.status(200).json({
      success: true,
      data: compensation,
    });
  },
};
