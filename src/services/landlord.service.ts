import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  agentCompensations,
  agentProperties,
  agentPropertyPermissions,
  landlordAgents,
  landlords,
  properties,
} from "../db/schema.js";

import { AppError } from "../errors/appError.js";

import type {
  AgentPermission,
  AssignPropertyInput,
} from "../types/agent.type.js";

export const landlordService = {
  // ASSIGN PROPERTY TO AGENT
  assignProperty: async (userId: string, input: AssignPropertyInput) => {
    // FIND LANDLORD
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    // VERIFY ACTIVE LANDLORD-AGENT RELATIONSHIP
    const landlordAgent = await db.query.landlordAgents.findFirst({
      where: and(
        eq(landlordAgents.id, input.landlordAgentId),
        eq(landlordAgents.landlordId, landlord.id),
        eq(landlordAgents.status, "ACTIVE"),
      ),
    });

    if (!landlordAgent) {
      throw new AppError("Active agent relationship not found", 404);
    }

    // VERIFY PROPERTY BELONGS TO LANDLORD
    const property = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, input.propertyId),
        eq(properties.landlordId, landlord.id),
      ),
    });

    if (!property) {
      throw new AppError("Property not found or does not belong to you", 404);
    }

    // CHECK EXISTING ASSIGNMENT

    // i will update this later to check either it has been assigned for another agent too
    const existing = await db.query.agentProperties.findFirst({
      where: and(
        eq(agentProperties.landlordAgentId, input.landlordAgentId),
        eq(agentProperties.propertyId, input.propertyId),
      ),
    });

    if (existing) {
      throw new AppError(
        "This property is already assigned to this agent",
        409,
      );
    }

    // CREATE ASSIGNMENT
    const [assignment] = await db
      .insert(agentProperties)
      .values({
        landlordAgentId: input.landlordAgentId,
        propertyId: input.propertyId,
      })
      .returning();

    if (!assignment) {
      throw new AppError("Failed to assign property to agent", 500);
    }

    return assignment;
  },

  // GET AGENT PROPERTIES
  getAgentProperties: async (userId: string, landlordAgentId: string) => {
    // FIND LANDLORD
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    // VERIFY RELATIONSHIP BELONGS TO LANDLORD
    const relationship = await db.query.landlordAgents.findFirst({
      where: and(
        eq(landlordAgents.id, landlordAgentId),
        eq(landlordAgents.landlordId, landlord.id),
      ),
    });

    if (!relationship) {
      throw new AppError("Agent relationship not found", 404);
    }

    // GET ASSIGNED PROPERTIES
    return db.query.agentProperties.findMany({
      where: eq(agentProperties.landlordAgentId, landlordAgentId),
      with: {
        property: true,
        permissions: true,
        compensations: true,
      },
      orderBy: (agentProperties, { desc }) => desc(agentProperties.createdAt),
    });
  },

  // REMOVE PROPERTY FROM AGENT
  removeProperty: async (userId: string, agentPropertyId: string) => {
    // FIND LANDLORD
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    // FIND ASSIGNMENT
    const assignment = await db.query.agentProperties.findFirst({
      where: eq(agentProperties.id, agentPropertyId),
      with: {
        landlordAgent: true,
      },
    });

    if (!assignment) {
      throw new AppError("Agent property assignment not found", 404);
    }

    // VERIFY LANDLORD OWNS THE RELATIONSHIP
    if (assignment.landlordAgent.landlordId !== landlord.id) {
      throw new AppError("Agent property assignment not found", 404);
    }

    // REMOVE ASSIGNMENT AND DEPENDENT RECORDS
    await db.transaction(async (tx) => {
      // REMOVE PERMISSIONS
      await tx
        .delete(agentPropertyPermissions)
        .where(eq(agentPropertyPermissions.agentPropertyId, agentPropertyId));

      // REMOVE COMPENSATION RECORDS
      await tx
        .delete(agentCompensations)
        .where(eq(agentCompensations.agentPropertyId, agentPropertyId));

      // REMOVE PROPERTY ASSIGNMENT
      await tx
        .delete(agentProperties)
        .where(eq(agentProperties.id, agentPropertyId));
    });

    return {
      id: agentPropertyId,
      removed: true,
    };
  },

  // VERIFY LANDLORD OWNS AGENT PROPERTY ASSIGNMENT
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

  // GET PERMISSIONS
  getPermissions: async (userId: string, agentPropertyId: string) => {
    await landlordService.getAgentProperty(userId, agentPropertyId);

    return db.query.agentPropertyPermissions.findMany({
      where: eq(agentPropertyPermissions.agentPropertyId, agentPropertyId),
    });
  },

  // SET PERMISSIONS
  setPermissions: async (
    userId: string,
    agentPropertyId: string,
    permissions: AgentPermission[],
  ) => {
    await landlordService.getAgentProperty(userId, agentPropertyId);

    const uniquePermissions = [...new Set(permissions)];

    await db.transaction(async (tx) => {
      await tx
        .delete(agentPropertyPermissions)
        .where(eq(agentPropertyPermissions.agentPropertyId, agentPropertyId));

      if (uniquePermissions.length > 0) {
        await tx.insert(agentPropertyPermissions).values(
          uniquePermissions.map((permission) => ({
            agentPropertyId,
            permission,
          })),
        );
      }
    });

    return db.query.agentPropertyPermissions.findMany({
      where: eq(agentPropertyPermissions.agentPropertyId, agentPropertyId),
    });
  },

  // GRANT PERMISSION
  grantPermission: async (
    userId: string,
    agentPropertyId: string,
    permission: AgentPermission,
  ) => {
    await landlordService.getAgentProperty(userId, agentPropertyId);

    const existing = await db.query.agentPropertyPermissions.findFirst({
      where: and(
        eq(agentPropertyPermissions.agentPropertyId, agentPropertyId),
        eq(agentPropertyPermissions.permission, permission),
      ),
    });

    if (existing) {
      throw new AppError("Agent already has this permission", 409);
    }

    const [created] = await db
      .insert(agentPropertyPermissions)
      .values({
        agentPropertyId,
        permission,
      })
      .returning();

    if (!created) {
      throw new AppError("Failed to grant permission", 500);
    }

    return created;
  },

  // REVOKE PERMISSION
  revokePermission: async (
    userId: string,
    agentPropertyId: string,
    permission: AgentPermission,
  ) => {
    await landlordService.getAgentProperty(userId, agentPropertyId);

    const existing = await db.query.agentPropertyPermissions.findFirst({
      where: and(
        eq(agentPropertyPermissions.agentPropertyId, agentPropertyId),
        eq(agentPropertyPermissions.permission, permission),
      ),
    });

    if (!existing) {
      throw new AppError("Agent does not have this permission", 404);
    }

    await db
      .delete(agentPropertyPermissions)
      .where(eq(agentPropertyPermissions.id, existing.id));

    return {
      permission,
      revoked: true,
    };
  },
};
