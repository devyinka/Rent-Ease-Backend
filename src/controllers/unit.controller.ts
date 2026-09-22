import type { Request, Response } from "express";

import { unitService } from "../services/unit.service.js";

export const unitController = {
  create: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const unit = await unitService.createUnit(
      req.user.id,
      req.params.propertyId as string,
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: unit,
    });
  },

  getAll: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const units = await unitService.getUnits(
      req.user.id,
      req.params.propertyId as string,
    );

    return res.status(200).json({
      success: true,
      data: units,
    });
  },

  getById: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const unit = await unitService.getUnitById(
      req.user.id,
      req.params.id as string,
    );

    return res.status(200).json({
      success: true,
      data: unit,
    });
  },

  update: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const unit = await unitService.updateUnit(
      req.user.id,
      req.params.id as string,
      req.body,
    );

    return res.status(200).json({
      success: true,
      data: unit,
    });
  },

  delete: async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const unit = await unitService.deleteUnit(
      req.user.id,
      req.params.id as string,
    );

    return res.status(200).json({
      success: true,
      data: unit,
    });
  },
};
