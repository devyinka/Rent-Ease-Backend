import type { Request, Response } from "express";

import { agentService } from "../services/agent.service.js";

export const agentController = {
  // GET MY PROFILE
  getMyProfile: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const agent = await agentService.getMyProfile(userId);

    res.status(200).json({
      success: true,
      data: agent,
    });
  },

  // UPDATE MY PROFILE
  updateMyProfile: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const agent = await agentService.updateMyProfile(userId, req.body);

    res.status(200).json({
      success: true,
      data: agent,
    });
  },

  // GET MY LANDLORDS
  getMyLandlords: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const landlords = await agentService.getMyLandlords(userId);

    res.status(200).json({
      success: true,
      data: landlords,
    });
  },

  // GET LANDLORD RELATIONSHIP
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

  // GET MY PROPERTIES
  getMyProperties: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const properties = await agentService.getMyProperties(userId);

    res.status(200).json({
      success: true,
      data: properties,
    });
  },

  // GET MY PROPERTY
  getMyProperty: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { agentPropertyId } = req.params;

    const property = await agentService.getMyProperty(
      userId,
      agentPropertyId as string,
    );

    res.status(200).json({
      success: true,
      data: property,
    });
  },

  // GET MY PROPERTY PERMISSIONS
  getMyPropertyPermissions: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { agentPropertyId } = req.params;

    const permissions = await agentService.getMyPermissions(
      userId,
      agentPropertyId as string,
    );

    res.status(200).json({
      success: true,
      data: permissions,
    });
  },

  // GET MY PROPERTY ACCESS
  getMyPropertyAccess: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { agentPropertyId } = req.params;

    const access = await agentService.getMyAccess(
      userId,
      agentPropertyId as string,
    );

    res.status(200).json({
      success: true,
      data: access,
    });
  },
};
