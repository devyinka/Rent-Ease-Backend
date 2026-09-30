import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  technicians,
  units,
  workOrders,
} from "../db/schema.js";

import { AppError } from "../errors/appError.js";
import { auditService } from "./audit.service.js";

import type {
  CreateWorkOrderInput,
  UpdateWorkOrderStatusInput,
} from "../types/workOrder.type.js";

export const workOrderService = {
  hasWorkOrderAccess: async (workOrderId: string, userId: string) => {
    const technician = await db.query.technicians.findFirst({
      where: eq(technicians.userId, userId),
    });

    if (!technician) {
      return false;
    }

    const workOrder = await db.query.workOrders.findFirst({
      where: and(
        eq(workOrders.id, workOrderId),
        eq(workOrders.technicianId, technician.id),
      ),
    });

    return Boolean(workOrder);
  },

  createWorkOrder: async (
    userId: string,
    propertyId: string,
    input: CreateWorkOrderInput,
  ) => {
    if (input.unitId) {
      const unit = await db.query.units.findFirst({
        where: and(eq(units.id, input.unitId), eq(units.propertyId, propertyId)),
      });

      if (!unit) {
        throw new AppError("Unit not found on this property", 404);
      }
    }

    if (input.technicianId) {
      const technician = await db.query.technicians.findFirst({
        where: eq(technicians.id, input.technicianId),
      });

      if (!technician) {
        throw new AppError("Technician not found", 404);
      }
    }

    const [workOrder] = await db
      .insert(workOrders)
      .values({
        propertyId,
        unitId: input.unitId,
        technicianId: input.technicianId,
        title: input.title.trim(),
        description: input.description?.trim(),
        assignedAt: input.technicianId ? new Date() : null,
      })
      .returning();

    if (!workOrder) {
      throw new AppError("Failed to create work order", 500);
    }

    await auditService.record({
      actorUserId: userId,
      action: "CREATE_WORK_ORDER",
      entity: "WORK_ORDER",
      entityId: workOrder.id,
      newValues: workOrder,
    });

    return workOrder;
  },

  getWorkOrdersForProperty: async (propertyId: string) => {
    return db.query.workOrders.findMany({
      where: eq(workOrders.propertyId, propertyId),
      with: {
        unit: true,
        technician: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  },

  getMyWorkOrders: async (userId: string) => {
    const technician = await db.query.technicians.findFirst({
      where: eq(technicians.userId, userId),
    });

    if (!technician) {
      throw new AppError("Technician profile not found", 404);
    }

    return db.query.workOrders.findMany({
      where: eq(workOrders.technicianId, technician.id),
      with: {
        property: {
          columns: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        unit: true,
      },
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  },

  getWorkOrderById: async (workOrderId: string) => {
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
      with: {
        property: {
          columns: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        unit: true,
        technician: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!workOrder) {
      throw new AppError("Work order not found", 404);
    }

    return workOrder;
  },

  updateWorkOrderStatus: async (
    userId: string,
    workOrderId: string,
    input: UpdateWorkOrderStatusInput,
  ) => {
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
    });

    if (!workOrder) {
      throw new AppError("Work order not found", 404);
    }

    const [updated] = await db
      .update(workOrders)
      .set({
        status: input.status,
        completedAt: input.status === "COMPLETED" ? new Date() : workOrder.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId))
      .returning();

    if (!updated) {
      throw new AppError("Failed to update work order", 500);
    }

    await auditService.record({
      actorUserId: userId,
      action: "UPDATE_WORK_ORDER_STATUS",
      entity: "WORK_ORDER",
      entityId: workOrderId,
      oldValues: workOrder,
      newValues: updated,
    });

    return updated;
  },
};
