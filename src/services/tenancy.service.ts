import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  landlords,
  properties,
  tenants,
  tenancies,
  units,
  users,
} from "../db/schema.js";
import { AppError } from "../errors/appError.js";
import type {
  CreateTenancyInput,
  UpdateTenancyInput,
} from "../types/tenancy.type.js";

const allowedRentFrequencies = [
  "MONTHLY",
  "QUARTERLY",
  "BI_ANNUAL",
  "ANNUAL",
  "CUSTOM",
] as const;

const isValidAmount = (value: string) => {
  return /^\d+(\.\d{1,2})?$/.test(value);
};

const parseDate = (value: string, fieldName: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }

  return date;
};

export const tenancyService = {
  createTenancy: async (userId: string, input: CreateTenancyInput) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const tenantResult = await db
      .select({
        tenant: tenants,
        user: users,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .where(eq(tenants.id, input.tenantId))
      .limit(1);

    const tenant = tenantResult[0];

    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    if (tenant.user.role !== "TENANT") {
      throw new AppError("Selected user is not a tenant", 400);
    }

    const unitResult = await db
      .select({
        unit: units,
        property: properties,
      })
      .from(units)
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(
        and(eq(units.id, input.unitId), eq(properties.landlordId, landlord.id)),
      )
      .limit(1);

    const unitResultItem = unitResult[0];

    if (!unitResultItem) {
      throw new AppError(
        "Unit not found or you do not have access to this unit",
        404,
      );
    }

    const startDate = parseDate(input.startDate, "Start date");

    let endDate: Date | undefined;

    if (input.endDate !== undefined) {
      endDate = parseDate(input.endDate, "End date");

      if (endDate < startDate) {
        throw new AppError("End date cannot be before start date", 400);
      }
    }

    const status = input.status ?? "PENDING";

    if (status !== "PENDING" && status !== "ACTIVE") {
      throw new AppError(
        "Tenancy can only be created as PENDING or ACTIVE",
        400,
      );
    }

    const rentAmount = input.rentAmount ?? unitResultItem.unit.rentAmount;

    if (!isValidAmount(rentAmount)) {
      throw new AppError("Rent amount must be a valid amount", 400);
    }

    const rentFrequency =
      input.rentFrequency ?? unitResultItem.unit.rentFrequency;

    if (!allowedRentFrequencies.includes(rentFrequency)) {
      throw new AppError("Invalid rent frequency", 400);
    }

    const depositAmount =
      input.depositAmount ?? unitResultItem.unit.depositAmount;

    if (!isValidAmount(depositAmount)) {
      throw new AppError("Deposit amount must be a valid amount", 400);
    }

    const serviceCharge =
      input.serviceCharge ?? unitResultItem.unit.serviceCharge;

    if (!isValidAmount(serviceCharge)) {
      throw new AppError("Service charge must be a valid amount", 400);
    }

    if (status === "ACTIVE") {
      const activeTenancy = await db.query.tenancies.findFirst({
        where: and(
          eq(tenancies.unitId, input.unitId),
          eq(tenancies.status, "ACTIVE"),
        ),
      });

      if (activeTenancy) {
        throw new AppError("This unit already has an active tenancy", 409);
      }
    }

    const [tenancy] = await db
      .insert(tenancies)
      .values({
        tenantId: input.tenantId,
        unitId: input.unitId,
        startDate,
        endDate,
        status,
        rentAmount,
        rentFrequency,
        depositAmount,
        serviceCharge,
      })
      .returning();

    if (!tenancy) {
      throw new AppError("Failed to create tenancy", 500);
    }

    return tenancy;
  },

  getTenancyById: async (userId: string, tenancyId: string) => {
    const result = await db
      .select({
        tenancy: tenancies,
        tenant: tenants,
        tenantUser: users,
        unit: units,
        property: properties,
        landlord: landlords,
      })
      .from(tenancies)
      .innerJoin(tenants, eq(tenancies.tenantId, tenants.id))
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(units, eq(tenancies.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .innerJoin(landlords, eq(properties.landlordId, landlords.id))
      .where(eq(tenancies.id, tenancyId))
      .limit(1);

    const resultItem = result[0];

    if (!resultItem) {
      throw new AppError("Tenancy not found", 404);
    }

    const isLandlord = resultItem.landlord.userId === userId;

    const isTenant = resultItem.tenant.userId === userId;

    if (!isLandlord && !isTenant) {
      throw new AppError("You do not have access to this tenancy", 403);
    }

    return resultItem;
  },

  updateTenancy: async (
    userId: string,
    tenancyId: string,
    input: UpdateTenancyInput,
  ) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const existingResult = await db
      .select({
        tenancy: tenancies,
        unit: units,
        property: properties,
      })
      .from(tenancies)
      .innerJoin(units, eq(tenancies.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(
        and(
          eq(tenancies.id, tenancyId),
          eq(properties.landlordId, landlord.id),
        ),
      )
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      throw new AppError(
        "Tenancy not found or you do not have access to it",
        404,
      );
    }

    const values: {
      startDate?: Date;
      endDate?: Date | null;
      rentAmount?: string;
      rentFrequency?:
        | "MONTHLY"
        | "QUARTERLY"
        | "BI_ANNUAL"
        | "ANNUAL"
        | "CUSTOM";
      depositAmount?: string;
      serviceCharge?: string;
    } = {};

    let startDate = existing.tenancy.startDate;

    if (input.startDate !== undefined) {
      startDate = parseDate(input.startDate, "Start date");
      values.startDate = startDate;
    }

    if (input.endDate !== undefined) {
      if (input.endDate === null) {
        values.endDate = null;
      } else {
        const endDate = parseDate(input.endDate, "End date");

        if (endDate < startDate) {
          throw new AppError("End date cannot be before start date", 400);
        }

        values.endDate = endDate;
      }
    }

    if (input.rentAmount !== undefined) {
      if (!isValidAmount(input.rentAmount)) {
        throw new AppError("Rent amount must be a valid amount", 400);
      }

      values.rentAmount = input.rentAmount;
    }

    if (input.rentFrequency !== undefined) {
      if (!allowedRentFrequencies.includes(input.rentFrequency)) {
        throw new AppError("Invalid rent frequency", 400);
      }

      values.rentFrequency = input.rentFrequency;
    }

    if (input.depositAmount !== undefined) {
      if (!isValidAmount(input.depositAmount)) {
        throw new AppError("Deposit amount must be a valid amount", 400);
      }

      values.depositAmount = input.depositAmount;
    }

    if (input.serviceCharge !== undefined) {
      if (!isValidAmount(input.serviceCharge)) {
        throw new AppError("Service charge must be a valid amount", 400);
      }

      values.serviceCharge = input.serviceCharge;
    }

    if (Object.keys(values).length === 0) {
      throw new AppError("No tenancy fields provided for update", 400);
    }

    const [updatedTenancy] = await db
      .update(tenancies)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(tenancies.id, tenancyId))
      .returning();

    if (!updatedTenancy) {
      throw new AppError("Failed to update tenancy", 500);
    }

    return updatedTenancy;
  },

  activateTenancy: async (userId: string, tenancyId: string) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const existingResult = await db
      .select({
        tenancy: tenancies,
        unit: units,
        property: properties,
      })
      .from(tenancies)
      .innerJoin(units, eq(tenancies.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(
        and(
          eq(tenancies.id, tenancyId),
          eq(properties.landlordId, landlord.id),
        ),
      )
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      throw new AppError(
        "Tenancy not found or you do not have access to it",
        404,
      );
    }

    if (existing.tenancy.status !== "PENDING") {
      throw new AppError("Only pending tenancies can be activated", 400);
    }

    const activeTenancy = await db.query.tenancies.findFirst({
      where: and(
        eq(tenancies.unitId, existing.tenancy.unitId),
        eq(tenancies.status, "ACTIVE"),
      ),
    });

    if (activeTenancy) {
      throw new AppError("This unit already has an active tenancy", 409);
    }

    const [updatedTenancy] = await db
      .update(tenancies)
      .set({
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(tenancies.id, tenancyId))
      .returning();

    if (!updatedTenancy) {
      throw new AppError("Failed to activate tenancy", 500);
    }

    return updatedTenancy;
  },

  //   endTenancy: async (
  //     userId: string,
  //     tenancyId: string,
  //     moveOutReason?: string,
  //   ) => {
  //     const landlord = await db.query.landlords.findFirst({
  //       where: eq(landlords.userId, userId),
  //     });

  //     if (!landlord) {
  //       throw new AppError("Landlord profile not found", 404);
  //     }

  //     const existingResult = await db
  //       .select({
  //         tenancy: tenancies,
  //         unit: units,
  //         property: properties,
  //       })
  //       .from(tenancies)
  //       .innerJoin(units, eq(tenancies.unitId, units.id))
  //       .innerJoin(properties, eq(units.propertyId, properties.id))
  //       .where(
  //         and(
  //           eq(tenancies.id, tenancyId),
  //           eq(properties.landlordId, landlord.id),
  //         ),
  //       )
  //       .limit(1);

  //     const existing = existingResult[0];

  //     if (!existing) {
  //       throw new AppError(
  //         "Tenancy not found or you do not have access to it",
  //         404,
  //       );
  //     }

  //     if (existing.tenancy.status !== "ACTIVE") {
  //       throw new AppError("Only active tenancies can be ended", 400);
  //     }

  //     const reason = moveOutReason?.trim();

  //     const [updatedTenancy] = await db
  //       .update(tenancies)
  //       .set({
  //         status: "ENDED",
  //         endDate: new Date(),
  //         moveOutReason: reason || null,
  //         updatedAt: new Date(),
  //       })
  //       .where(eq(tenancies.id, tenancyId))
  //       .returning();

  //     if (!updatedTenancy) {
  //       throw new AppError("Failed to end tenancy", 500);
  //     }

  //     return updatedTenancy;
  //   },
};
