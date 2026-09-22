import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { properties, landlords } from "../db/schema.js";
import { AppError } from "../errors/appError.js";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "../types/property.type.js";

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
    const result = await db
      .select()
      .from(properties)
      .innerJoin(landlords, eq(properties.landlordId, landlords.id))
      .where(and(eq(properties.id, propertyId), eq(landlords.userId, userId)))
      .limit(1);

    const property = result[0]?.properties;

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
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const existing = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, propertyId),
        eq(properties.landlordId, landlord.id),
      ),
    });

    if (!existing) {
      throw new AppError("Property not found", 404);
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
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.landlordId, landlord.id),
        ),
      )
      .returning();

    if (!updatedProperty) {
      throw new AppError("Failed to update property", 500);
    }

    return updatedProperty;
  },

  deleteProperty: async (userId: string, propertyId: string) => {
    const landlord = await db
      .select({
        id: landlords.id,
      })
      .from(landlords)
      .where(eq(landlords.userId, userId))
      .limit(1);

    if (landlord.length === 0) {
      throw new AppError("Landlord profile not found", 404);
    }

    const existingProperty = await db
      .select({
        id: properties.id,
      })
      .from(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.landlordId, landlord[0].id),
        ),
      )
      .limit(1);

    if (existingProperty.length === 0) {
      throw new AppError("Property not found", 404);
    }

    const [deletedProperty] = await db
      .delete(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.landlordId, landlord[0].id),
        ),
      )
      .returning();

    return deletedProperty;
  },
};
