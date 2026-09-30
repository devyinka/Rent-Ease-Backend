import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { properties, landlords } from "../db/schema.js";
import { AppError } from "../errors/appError.js";
import { auditService } from "./audit.service.js";
import { agentService } from "./agent.service.js";
import { propertyAccessService } from "./property-access.service.js";
import type { AgentPermission } from "../types/agent.type.js";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "../types/property.type.js";

async function hasPropertyAccess(
  userId: string,
  propertyId: string,
  permission: AgentPermission,
) {
  if (await propertyAccessService.userOwnsProperty(userId, propertyId)) {
    return true;
  }

  try {
    return await agentService.hasPermission(userId, propertyId, permission);
  } catch {
    return false;
  }
}

export const propertyService = {
  createProperty: async (userId: string, input: CreatePropertyInput) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const name = input.name.trim();
    const address = input.address.trim();
    const city = input.city.trim();
    const state = input.state.trim();
    const country = input.country?.trim() || "Nigeria";
    const description = input.description?.trim() || null;
    const imageUrl = input.imageUrl?.trim() || null;

    if (!name) {
      throw new AppError("Property name is required", 400);
    }

    if (!address) {
      throw new AppError("Property address is required", 400);
    }

    if (!city) {
      throw new AppError("Property city is required", 400);
    }

    if (!state) {
      throw new AppError("Property state is required", 400);
    }

    const [property] = await db
      .insert(properties)
      .values({
        landlordId: landlord.id,
        name,
        address,
        city,
        state,
        country,
        description,
        imageUrl,
      })
      .returning();

    if (!property) {
      throw new AppError("Failed to create property", 500);
    }

    await auditService.record({
      actorUserId: userId,
      action: "CREATE",
      entity: "PROPERTY",
      entityId: property.id,
      newValues: property,
    });

    return property;
  },

  getProperties: async (userId: string) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    return db
      .select()
      .from(properties)
      .where(eq(properties.landlordId, landlord.id));
  },

  getPropertyById: async (userId: string, propertyId: string) => {
    const hasAccess = await hasPropertyAccess(
      userId,
      propertyId,
      "VIEW_PROPERTY",
    );

    const property = hasAccess
      ? await db.query.properties.findFirst({
          where: eq(properties.id, propertyId),
        })
      : undefined;

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    return property;
  },
  updateProperty: async (
    userId: string,
    propertyId: string,
    input: UpdatePropertyInput,
  ) => {
    const existing = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    });

    if (!existing) {
      throw new AppError("Property not found", 404);
    }

    if (!(await hasPropertyAccess(userId, propertyId, "MANAGE_PROPERTY"))) {
      throw new AppError("You do not have access to this property", 403);
    }

    const values: UpdatePropertyInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        throw new AppError("Property name cannot be empty", 400);
      }

      values.name = name;
    }

    if (input.address !== undefined) {
      const address = input.address.trim();

      if (!address) {
        throw new AppError("Property address cannot be empty", 400);
      }

      values.address = address;
    }

    if (input.city !== undefined) {
      const city = input.city.trim();

      if (!city) {
        throw new AppError("Property city cannot be empty", 400);
      }

      values.city = city;
    }

    if (input.state !== undefined) {
      const state = input.state.trim();

      if (!state) {
        throw new AppError("Property state cannot be empty", 400);
      }

      values.state = state;
    }

    if (input.country !== undefined) {
      const country = input.country.trim();

      if (!country) {
        throw new AppError("Property country cannot be empty", 400);
      }

      values.country = country;
    }

    if (input.description !== undefined) {
      values.description = input.description.trim() || undefined;
    }

    if (input.imageUrl !== undefined) {
      values.imageUrl = input.imageUrl.trim() || undefined;
    }

    if (Object.keys(values).length === 0) {
      throw new AppError("No property fields provided for update", 400);
    }

    const [updatedProperty] = await db
      .update(properties)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();

    if (!updatedProperty) {
      throw new AppError("Failed to update property", 500);
    }

    await auditService.record({
      actorUserId: userId,
      action: "UPDATE",
      entity: "PROPERTY",
      entityId: updatedProperty.id,
      oldValues: existing,
      newValues: updatedProperty,
    });

    return updatedProperty;
  },

  deleteProperty: async (userId: string, propertyId: string) => {
    const existingProperty = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    });

    if (!existingProperty) {
      throw new AppError("Property not found", 404);
    }

    if (!(await hasPropertyAccess(userId, propertyId, "MANAGE_PROPERTY"))) {
      throw new AppError("You do not have access to this property", 403);
    }

    const [deletedProperty] = await db
      .delete(properties)
      .where(eq(properties.id, propertyId))
      .returning();

    if (deletedProperty) {
      await auditService.record({
        actorUserId: userId,
        action: "DELETE",
        entity: "PROPERTY",
        entityId: deletedProperty.id,
        oldValues: deletedProperty,
      });
    }

    return deletedProperty;
  },
};
