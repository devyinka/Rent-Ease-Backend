import type { Request, Response } from "express";

import { landlordService } from "../services/landlord.service";
import {
  assignPropertySchema,
  agentIdParamSchema,
  permissionListSchema,
  permissionParamSchema,
  permissionSchema,
} from "../routes/landlord.route.js";

export const landlordController = {
  // GET ALL AGENTS CONNECTED TO THE LANDLORD
  getAgents: async (req: Request, res: Response) => {
    const agents = await landlordService.getAgents(req.user!.id);

    return res.status(200).json({
      success: true,
      data: agents,
    });
  },

  // GET ONE AGENT CONNECTED TO THE LANDLORD
  getAgent: async (req: Request, res: Response) => {
    const agent = await landlordService.getAgent(
      req.user!.id,
      agentIdParamSchema.parse(req.params.agentId),
    );

    return res.status(200).json({
      success: true,
      data: agent,
    });
  },

  // ASSIGN PROPERTY TO AGENT
  assignProperty: async (req: Request, res: Response) => {
    const assignment = await landlordService.assignProperty(
      req.user!.id,
      assignPropertySchema.parse(req.body),
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
      permissionListSchema.parse(req.body),
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
      permissionSchema.parse(req.body),
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
      permissionParamSchema.parse(permission),
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  },
};
