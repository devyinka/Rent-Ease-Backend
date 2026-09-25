import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  agentCompensations,
  agentProperties,
  landlords,
} from "../db/schema.js";

import { AppError } from "../errors/appError.js";
import { CreateAgentCompensationInput } from "../types/agent.type.js";

export const agentCompensationService = {
  // VERIFY LANDLORD OWNERSHIP
  getAgentProperty: async (userId: string, agentPropertyId: string) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const assignment = await db.query.agentProperties.findFirst({
      where: eq(agentProperties.id, agentPropertyId),
      with: {
        landlordAgent: true,
      },
    });

    if (!assignment) {
      throw new AppError("Agent property not found", 404);
    }

    if (assignment.landlordAgent.landlordId !== landlord.id) {
      throw new AppError("Agent property not found", 404);
    }

    return assignment;
  },

  // GET COMPENSATIONS
  getCompensations: async (userId: string, agentPropertyId: string) => {
    await agentCompensationService.getAgentProperty(userId, agentPropertyId);

    return db.query.agentCompensations.findMany({
      where: eq(agentCompensations.agentPropertyId, agentPropertyId),
      orderBy: (table, { desc }) => desc(table.effectiveFrom),
    });
  },

  // CREATE COMPENSATION
  createCompensation: async (
    userId: string,
    agentPropertyId: string,
    input: CreateAgentCompensationInput,
  ) => {
    await agentCompensationService.getAgentProperty(userId, agentPropertyId);

    const value = Number(input.value);

    if (!Number.isFinite(value) || value < 0) {
      throw new AppError(
        "Compensation value must be a valid non-negative number",
        400,
      );
    }

    if (input.type === "PERCENTAGE" && value > 100) {
      throw new AppError("Percentage compensation cannot exceed 100", 400);
    }

    if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
      throw new AppError(
        "Effective end date cannot be before effective start date",
        400,
      );
    }

    const [compensation] = await db
      .insert(agentCompensations)
      .values({
        agentPropertyId,
        type: input.type,
        value: input.value,
        frequency: input.frequency,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
      })
      .returning();

    if (!compensation) {
      throw new AppError("Failed to create agent compensation", 500);
    }

    return compensation;
  },

  // END COMPENSATION
  endCompensation: async (
    userId: string,
    compensationId: string,
    effectiveTo: Date,
  ) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const compensation = await db.query.agentCompensations.findFirst({
      where: eq(agentCompensations.id, compensationId),
      with: {
        agentProperty: {
          with: {
            landlordAgent: true,
          },
        },
      },
    });

    if (!compensation) {
      throw new AppError("Agent compensation not found", 404);
    }

    if (compensation.agentProperty.landlordAgent.landlordId !== landlord.id) {
      throw new AppError("Agent compensation not found", 404);
    }

    if (effectiveTo < compensation.effectiveFrom) {
      throw new AppError(
        "Effective end date cannot be before effective start date",
        400,
      );
    }

    const [updated] = await db
      .update(agentCompensations)
      .set({
        effectiveTo,
        updatedAt: new Date(),
      })
      .where(eq(agentCompensations.id, compensationId))
      .returning();

    if (!updated) {
      throw new AppError("Failed to end agent compensation", 500);
    }

    return updated;
  },
};
