import type { Request, Response } from "express";

import { landlordService } from "../services/landlord.service";
import { AgentPermission } from "../types/agent.type";

export const landlordController = {
  // ASSIGN PROPERTY TO AGENT
  assignProperty: async (req: Request, res: Response) => {
    const assignment = await landlordService.assignProperty(
      req.user!.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: assignment,
    });
  },

  // GET AGENT PROPERTIES
  getAgentProperties: async (req: Request, res: Response) => {
    const { landlordAgentId } = req.params;

    const properties = await landlordService.getAgentProperties(
      req.user!.id,
      landlordAgentId as string,
    );

    return res.status(200).json({
      success: true,
      data: properties,
    });
  },

  // REMOVE PROPERTY FROM AGENT
  removeProperty: async (req: Request, res: Response) => {
    const { agentPropertyId } = req.params;

    const result = await landlordService.removeProperty(
      req.user!.id,
      agentPropertyId as string,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },

  getPermissions: async (req: Request, res: Response) => {
    const { agentPropertyId } = req.params;

    const permissions = await landlordService.getPermissions(
      req.user!.id,
      agentPropertyId as string,
    );

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  },

  // SET AGENT PROPERTY PERMISSIONS
  setPermissions: async (req: Request, res: Response) => {
    const { agentPropertyId } = req.params;

    const permissions = await landlordService.setPermissions(
      req.user!.id,
      agentPropertyId as string,
      req.body,
    );

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  },

  // GRANT PERMISSION
  grantPermission: async (req: Request, res: Response) => {
    const { agentPropertyId } = req.params;

    const permission = await landlordService.grantPermission(
      req.user!.id,
      agentPropertyId as string,
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: permission,
    });
  },

  // REVOKE PERMISSION
  revokePermission: async (req: Request, res: Response) => {
    const { agentPropertyId, permission } = req.params;

    const result = await landlordService.revokePermission(
      req.user!.id,
      agentPropertyId as string,
      permission as AgentPermission,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },
};
