import type { NextFunction, Request, Response } from "express";

export type WorkOrderAccessResolver = (
  workOrderId: string,
  userId: string,
) => Promise<boolean>;

export function requireTechnicianWorkOrderAccess(
  resolveAccess: WorkOrderAccessResolver,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "TECHNICIAN") {
      return res.status(403).json({
        success: false,
        message: "Only technicians can access work orders",
      });
    }

    const workOrderId = (req.params.workOrderId ?? req.params.id) as string;

    if (!workOrderId) {
      return res.status(400).json({
        success: false,
        message: "Work order ID is required",
      });
    }

    try {
      const hasAccess = await resolveAccess(workOrderId, req.user.id);

      if (!hasAccess) {
        return res.status(404).json({
          success: false,
          message: "Work order not found",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
