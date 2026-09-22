import type { NextFunction, Request, Response } from "express";

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

  const propertyId = req.params.propertyId;

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
