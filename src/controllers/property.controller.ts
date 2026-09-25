import type { Request, Response } from "express";

import { propertyService } from "../services/property.service.js";

export const propertyController = {
  create: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const property = await propertyService.createProperty(
      req.user.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: property,
    });
  },

  getAll: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const properties = await propertyService.getProperties(req.user.id);

    return res.status(200).json({
      success: true,
      data: properties,
    });
  },

  getById: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const property = await propertyService.getPropertyById(
      req.user.id,
      req.params.propertyId as string,
    );

    return res.status(200).json({
      success: true,
      data: property,
    });
  },

  update: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const property = await propertyService.updateProperty(
      req.user.id,
      req.params.propertyId as string,
      req.body,
    );

    return res.status(200).json({
      success: true,
      data: property,
    });
  },

  delete: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const property = await propertyService.deleteProperty(
      req.user.id,
      req.params.propertyId as string,
    );

    return res.status(200).json({
      success: true,
      data: property,
    });
  },
};
