import type { NextFunction, Request, Response } from "express";

import type { AgentPermission } from "../types/agent.type.js";
import { agentService } from "../services/agent.service.js";
import { propertyAccessService } from "../services/property-access.service.js";

export async function requirePropertyOwner(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const propertyId = req.params.propertyId ?? req.params.id;

  if (!propertyId) {
    return res.status(400).json({
      success: false,
      message: "Property ID is required",
    });
  }

  try {
    const hasAccess = await propertyAccessService.userOwnsProperty(
      req.user.id,
      propertyId as string,
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this property",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requirePropertyPermission(permission: AgentPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const propertyId = (req.params.propertyId ?? req.params.id) as string;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required",
      });
    }

    try {
      // Landlords authorize by ownership; agents require the explicit permission for this property.
      if (req.user.role === "LANDLORD") {
        const ownsProperty = await propertyAccessService.userOwnsProperty(
          req.user.id,
          propertyId,
        );

        if (!ownsProperty) {
          return res.status(404).json({
            success: false,
            message: "Property not found",
          });
        }
      } else if (req.user.role === "AGENT") {
        await agentService.requirePermission(
          req.user.id,
          propertyId,
          permission,
        );
      } else {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this property",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function requireAgentPropertyAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const agentPropertyId = req.params.agentPropertyId as string;

  if (!agentPropertyId) {
    return res.status(400).json({
      success: false,
      message: "Agent property ID is required",
    });
  }

  try {
    await agentService.getMyProperty(req.user.id, agentPropertyId);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAgentPermission(permission: AgentPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const agentPropertyId = req.params.agentPropertyId as string;

    if (!agentPropertyId) {
      return res.status(400).json({
        success: false,
        message: "Agent property ID is required",
      });
    }

    try {
      const assignment = await agentService.getMyProperty(
        req.user.id,
        agentPropertyId,
      );

      if (
        !assignment.permissions.some((item) => item.permission === permission)
      ) {
        return res.status(403).json({
          success: false,
          message: `You do not have the ${permission} permission for this property`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
