import type { Request, Response } from "express";

import { agentService } from "../services/agent.service.js";

export const agentController = {
  getMyProfile: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const agent = await agentService.getMyProfile(userId);

    res.status(200).json({
      success: true,
      data: agent,
    });
  },

  updateMyProfile: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const agent = await agentService.updateMyProfile(userId, req.body);

    res.status(200).json({
      success: true,
      data: agent,
    });
  },

  getMyLandlords: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const landlords = await agentService.getMyLandlords(userId);

    res.status(200).json({
      success: true,
      data: landlords,
    });
  },

  getLandlordRelationship: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { relationshipId } = req.params;

    const relationship = await agentService.getLandlordRelationship(
      userId,
      relationshipId as string,
    );

    res.status(200).json({
      success: true,
      data: relationship,
    });
  },

  acceptRelationship: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { relationshipId } = req.params;
  },

  revokeRelationship: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { relationshipId } = req.params;

    const relationship = await agentService.revokeRelationship(
      userId,
      relationshipId as string,
    );

    res.status(200).json({
      success: true,
      data: relationship,
    });
  },
};
