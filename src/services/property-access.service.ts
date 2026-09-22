import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { landlords, properties } from "../db/schema.js";

export const propertyAccessService = {
  userOwnsProperty: async (
    userId: string,
    propertyId: string,
  ): Promise<boolean> => {
    const result = await db
      .select({
        propertyId: properties.id,
      })
      .from(properties)
      .innerJoin(landlords, eq(properties.landlordId, landlords.id))
      .where(and(eq(properties.id, propertyId), eq(landlords.userId, userId)))
      .limit(1);

    return result.length > 0;
  },
};
