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
import type { UpdateTenantInput } from "../types/tenant.type.js";

export const tenantService = {
  getMyTenant: async (userId: string) => {
    const result = await db
      .select({
        tenant: tenants,
        user: users,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .where(eq(tenants.userId, userId))
      .limit(1);

    const tenant = result[0];

    if (!tenant) {
      throw new AppError("Tenant profile not found", 404);
    }

    return tenant;
  },

  getTenantsForLandlord: async (userId: string) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const result = await db
      .selectDistinct({
        tenant: tenants,
        user: users,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(tenancies, eq(tenancies.tenantId, tenants.id))
      .innerJoin(units, eq(tenancies.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(properties.landlordId, landlord.id));

    return result;
  },

  getTenantById: async (userId: string, tenantId: string) => {
    const tenantResult = await db
      .select({
        tenant: tenants,
        user: users,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const result = tenantResult[0];

    if (!result) {
      throw new AppError("Tenant not found", 404);
    }

    if (result.tenant.userId === userId) {
      return result;
    }

    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("You do not have access to this tenant", 403);
    }

    const access = await db
      .select({
        tenantId: tenants.id,
      })
      .from(tenants)
      .innerJoin(tenancies, eq(tenancies.tenantId, tenants.id))
      .innerJoin(units, eq(tenancies.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(
        and(eq(tenants.id, tenantId), eq(properties.landlordId, landlord.id)),
      )
      .limit(1);

    if (access.length === 0) {
      throw new AppError("You do not have access to this tenant", 403);
    }

    return result;
  },

  updateTenant: async (
    userId: string,
    tenantId: string,
    input: UpdateTenantInput,
  ) => {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    if (tenant.userId !== userId) {
      throw new AppError(
        "You do not have permission to update this tenant",
        403,
      );
    }

    const values: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    } = {};

    if (input.firstName !== undefined) {
      const firstName = input.firstName.trim();

      if (!firstName) {
        throw new AppError("First name cannot be empty", 400);
      }

      values.firstName = firstName;
    }

    if (input.lastName !== undefined) {
      const lastName = input.lastName.trim();

      if (!lastName) {
        throw new AppError("Last name cannot be empty", 400);
      }

      values.lastName = lastName;
    }

    if (input.phone !== undefined) {
      const phone = input.phone.trim();

      if (!phone) {
        throw new AppError("Phone cannot be empty", 400);
      }

      values.phone = phone;
    }

    if (Object.keys(values).length === 0) {
      throw new AppError("No tenant fields provided for update", 400);
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new AppError("Failed to update tenant profile", 500);
    }

    return {
      tenant,
      user: updatedUser,
    };
  },
};
