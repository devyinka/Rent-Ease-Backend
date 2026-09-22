import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { properties, units } from "../db/schema.js";

import type { CreateUnitInput, UpdateUnitInput } from "../types/unit.type.js";

import { AppError } from "../errors/appError.js";

import { propertyAccessService } from "./property-access.service.js";

export const unitService = {
  createUnit: async (
    userId: string,
    propertyId: string,
    input: CreateUnitInput,
  ) => {
    const hasAccess = await propertyAccessService.userOwnsProperty(
      userId,
      propertyId,
    );

    if (!hasAccess) {
      throw new AppError(
        "Property not found or you do not have access to it",
        404,
      );
    }

    const unitNumber = input.unitNumber.trim();

    if (!unitNumber) {
      throw new AppError("Unit number is required", 400);
    }

    const existingUnit = await db
      .select({
        id: units.id,
      })
      .from(units)
      .where(
        and(eq(units.propertyId, propertyId), eq(units.unitNumber, unitNumber)),
      )
      .limit(1);

    if (existingUnit.length > 0) {
      throw new AppError(
        "A unit with this number already exists in this property",
        409,
      );
    }

    const [unit] = await db
      .insert(units)
      .values({
        propertyId,
        unitNumber,
        unitType: input.unitType,
        floor: input.floor,
        bedrooms: input.bedrooms ?? 0,
        bathrooms: input.bathrooms ?? 0,
        rentAmount: input.rentAmount,
        rentFrequency: input.rentFrequency,
        serviceCharge: input.serviceCharge ?? "0",
        depositAmount: input.depositAmount ?? "0",
        notes: input.notes?.trim() || null,
      })
      .returning();

    return unit;
  },

  getUnits: async (userId: string, propertyId: string) => {
    const hasAccess = await propertyAccessService.userOwnsProperty(
      userId,
      propertyId,
    );

    if (!hasAccess) {
      throw new AppError(
        "Property not found or you do not have access to it",
        404,
      );
    }

    return db.select().from(units).where(eq(units.propertyId, propertyId));
  },

  getUnitById: async (userId: string, unitId: string) => {
    const result = await db
      .select({
        unit: units,
        propertyId: properties.id,
      })
      .from(units)
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(units.id, unitId))
      .limit(1);

    if (result.length === 0) {
      throw new AppError("Unit not found", 404);
    }

    const hasAccess = await propertyAccessService.userOwnsProperty(
      userId,
      result[0].propertyId,
    );

    if (!hasAccess) {
      throw new AppError("You do not have access to this unit", 403);
    }

    return result[0].unit;
  },

  updateUnit: async (
    userId: string,
    unitId: string,
    input: UpdateUnitInput,
  ) => {
    const existing = await db
      .select({
        unit: units,
        propertyId: properties.id,
      })
      .from(units)
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(units.id, unitId))
      .limit(1);

    if (existing.length === 0) {
      throw new AppError("Unit not found", 404);
    }

    const hasAccess = await propertyAccessService.userOwnsProperty(
      userId,
      existing[0].propertyId,
    );

    if (!hasAccess) {
      throw new AppError("You do not have access to this unit", 403);
    }

    const updateValues: Partial<typeof units.$inferInsert> = {};

    if (input.unitNumber !== undefined) {
      const unitNumber = input.unitNumber.trim();

      if (!unitNumber) {
        throw new AppError("Unit number cannot be empty", 400);
      }

      const duplicate = await db
        .select({
          id: units.id,
        })
        .from(units)
        .where(
          and(
            eq(units.propertyId, existing[0].propertyId),
            eq(units.unitNumber, unitNumber),
          ),
        )
        .limit(1);

      if (duplicate.length > 0 && duplicate[0].id !== unitId) {
        throw new AppError(
          "A unit with this number already exists in this property",
          409,
        );
      }

      updateValues.unitNumber = unitNumber;
    }

    if (input.unitType !== undefined) {
      updateValues.unitType = input.unitType;
    }

    if (input.floor !== undefined) {
      updateValues.floor = input.floor;
    }

    if (input.bedrooms !== undefined) {
      updateValues.bedrooms = input.bedrooms;
    }

    if (input.bathrooms !== undefined) {
      updateValues.bathrooms = input.bathrooms;
    }

    if (input.rentAmount !== undefined) {
      updateValues.rentAmount = input.rentAmount;
    }

    if (input.rentFrequency !== undefined) {
      updateValues.rentFrequency = input.rentFrequency;
    }

    if (input.serviceCharge !== undefined) {
      updateValues.serviceCharge = input.serviceCharge;
    }

    if (input.depositAmount !== undefined) {
      updateValues.depositAmount = input.depositAmount;
    }

    if (input.notes !== undefined) {
      updateValues.notes = input.notes.trim() || null;
    }

    if (Object.keys(updateValues).length === 0) {
      throw new AppError("No fields provided for update", 400);
    }

    updateValues.updatedAt = new Date();

    const [updatedUnit] = await db
      .update(units)
      .set(updateValues)
      .where(eq(units.id, unitId))
      .returning();

    return updatedUnit;
  },

  deleteUnit: async (userId: string, unitId: string) => {
    const existing = await db
      .select({
        id: units.id,
        propertyId: properties.id,
      })
      .from(units)
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(units.id, unitId))
      .limit(1);

    if (existing.length === 0) {
      throw new AppError("Unit not found", 404);
    }

    const hasAccess = await propertyAccessService.userOwnsProperty(
      userId,
      existing[0].propertyId,
    );

    if (!hasAccess) {
      throw new AppError("You do not have access to this unit", 403);
    }

    const [deletedUnit] = await db
      .delete(units)
      .where(eq(units.id, unitId))
      .returning();

    return deletedUnit;
  },
};
