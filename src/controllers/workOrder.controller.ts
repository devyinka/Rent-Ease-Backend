import type { Request, Response } from "express";

import {
  createWorkOrderSchema,
  updateWorkOrderStatusSchema,
} from "../routes/workOrder.route.js";
import { workOrderService } from "../services/workOrder.service.js";

export const workOrderController = {
  create: async (req: Request, res: Response) => {
    const workOrder = await workOrderService.createWorkOrder(
      req.user!.id,
      req.params.propertyId as string,
      createWorkOrderSchema.parse(req.body),
    );

    return res.status(201).json({
      success: true,
      data: workOrder,
    });
  },

  getForProperty: async (req: Request, res: Response) => {
    const workOrders = await workOrderService.getWorkOrdersForProperty(
      req.params.propertyId as string,
    );

    return res.status(200).json({
      success: true,
      data: workOrders,
    });
  },

  getMine: async (req: Request, res: Response) => {
    const workOrders = await workOrderService.getMyWorkOrders(req.user!.id);

    return res.status(200).json({
      success: true,
      data: workOrders,
    });
  },

  getById: async (req: Request, res: Response) => {
    const workOrder = await workOrderService.getWorkOrderById(
      (req.params.workOrderId ?? req.params.id) as string,
    );

    return res.status(200).json({
      success: true,
      data: workOrder,
    });
  },

  updateStatus: async (req: Request, res: Response) => {
    const workOrder = await workOrderService.updateWorkOrderStatus(
      req.user!.id,
      (req.params.workOrderId ?? req.params.id) as string,
      updateWorkOrderStatusSchema.parse(req.body),
    );

    return res.status(200).json({
      success: true,
      data: workOrder,
    });
  },
};
