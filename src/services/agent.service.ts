import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { agents, landlordAgents, users } from "../db/schema.js";

import { AppError } from "../errors/appError.js";

import type { UpdateAgentInput } from "../types/agent.type.js";

export const agentService = {
  // GET MY PROFILE
  getMyProfile: async (userId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
      with: {
        user: true,
      },
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    return agent;
  },

  // UPDATE MY PROFILE
  updateMyProfile: async (userId: string, input: UpdateAgentInput) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const updates: Partial<typeof users.$inferInsert> = {};

    // FIRST NAME
    if (input.firstName !== undefined) {
      const firstName = input.firstName.trim();

      if (!firstName) {
        throw new AppError("First name cannot be empty", 400);
      }

      updates.firstName = firstName;
    }

    // LAST NAME
    if (input.lastName !== undefined) {
      const lastName = input.lastName.trim();

      if (!lastName) {
        throw new AppError("Last name cannot be empty", 400);
      }

      updates.lastName = lastName;
    }

    // PHONE
    if (input.phone !== undefined) {
      const phone = input.phone.trim();

      if (!phone) {
        throw new AppError("Phone cannot be empty", 400);
      }

      const existingPhone = await db.query.users.findFirst({
        where: eq(users.phone, phone),
      });

      if (existingPhone && existingPhone.id !== userId) {
        throw new AppError("Phone number already in use", 409);
      }

      updates.phone = phone;
    }

    // CHECK FOR UPDATES
    if (Object.keys(updates).length === 0) {
      throw new AppError("No fields to update", 400);
    }

    updates.updatedAt = new Date();

    // UPDATE USER
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new AppError("Failed to update agent profile", 500);
    }

    return updatedUser;
  },

  // GET MY LANDLORDS
  getMyLandlords: async (userId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const relationships = await db.query.landlordAgents.findMany({
      where: eq(landlordAgents.agentId, agent.id),
      with: {
        landlord: {
          with: {
            user: true,
          },
        },
      },
      orderBy: (landlordAgents, { desc }) => desc(landlordAgents.createdAt),
    });

    return relationships;
  },

  // GET LANDLORD RELATIONSHIP
  getLandlordRelationship: async (userId: string, relationshipId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const relationship = await db.query.landlordAgents.findFirst({
      where: and(
        eq(landlordAgents.id, relationshipId),
        eq(landlordAgents.agentId, agent.id),
      ),
      with: {
        landlord: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!relationship) {
      throw new AppError("Landlord relationship not found", 404);
    }

    return relationship;
  },

  // REVOKE LANDLORD RELATIONSHIP
  revokeRelationship: async (userId: string, relationshipId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const relationship = await db.query.landlordAgents.findFirst({
      where: and(
        eq(landlordAgents.id, relationshipId),
        eq(landlordAgents.agentId, agent.id),
      ),
    });

    if (!relationship) {
      throw new AppError("Landlord relationship not found", 404);
    }

    if (relationship.status === "REVOKED") {
      throw new AppError("This landlord relationship is already revoked", 409);
    }

    // REVOKE RELATIONSHIP
    const [updatedRelationship] = await db
      .update(landlordAgents)
      .set({
        status: "REVOKED",
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(landlordAgents.id, relationship.id))
      .returning();

    if (!updatedRelationship) {
      throw new AppError("Failed to revoke landlord relationship", 500);
    }

    return updatedRelationship;
  },
};
