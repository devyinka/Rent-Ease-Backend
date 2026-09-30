import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  agentProperties,
  agentPropertyPermissions,
  landlordAgents,
  landlords,
  properties,
} from "../db/schema.js";

import { AppError } from "../errors/appError.js";
import { auditService } from "./audit.service.js";

import type {
  AgentPermission,
  AssignPropertyInput,
} from "../types/agent.type.js";

export const landlordService = {
  // Return only agent information a landlord needs to manage relationships.
  getAgents: async (userId: string) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const relationships = await db.query.landlordAgents.findMany({
      where: eq(landlordAgents.landlordId, landlord.id),
      with: {
        agent: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
              },
            },
          },
        },
        properties: {
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
      orderBy: (table, { desc }) => desc(table.createdAt),
    });

    return relationships.map((relationship) => ({
      relationshipId: relationship.id,
      agentId: relationship.agent.id,
      status: relationship.status,
      acceptedAt: relationship.acceptedAt,
      revokedAt: relationship.revokedAt,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
      agent: relationship.agent.user,
      properties: relationship.properties.map((assignment) => ({
        agentPropertyId: assignment.id,
        status: assignment.status,
        property: assignment.property,
      })),
    }));
  },

  getAgent: async (userId: string, agentId: string) => {
    const landlord = await db.query.landlords.findFirst({
      where: eq(landlords.userId, userId),
    });

    if (!landlord) {
      throw new AppError("Landlord profile not found", 404);
    }

    const relationship = await db.query.landlordAgents.findFirst({
      where: and(
        eq(landlordAgents.landlordId, landlord.id),
        eq(landlordAgents.agentId, agentId),
      ),
      with: {
        agent: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
              },
            },
          },
        },
        properties: {
          with: {
            property: {
              columns: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
            permissions: true,
          },
        },
      },
    });

    if (!relationship) {
      throw new AppError("Agent relationship not found", 404);
    }

    return {
      relationshipId: relationship.id,
      agentId: relationship.agent.id,
      status: relationship.status,
      acceptedAt: relationship.acceptedAt,
      revokedAt: relationship.revokedAt,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
      agent: relationship.agent.user,
      properties: relationship.properties.map((assignment) => ({
        agentPropertyId: assignment.id,
        status: assignment.status,
        property: assignment.property,
        permissions: assignment.permissions,
      })),
    };
  },

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

    // I will update this later to check either it has been assigned for another agent too
    const existing = await db.query.agentProperties.findFirst({
      where: and(
        eq(agentProperties.landlordAgentId, input.landlordAgentId),
        eq(agentProperties.propertyId, input.propertyId),
        eq(agentProperties.status, "ACTIVE"),
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

    await auditService.record({
      actorUserId: userId,
      action: "ASSIGN_PROPERTY",
      entity: "AGENT_PROPERTY",
      entityId: assignment.id,
      newValues: assignment,
    });

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

    // Revoke the assignment while preserving permissions and compensation history.
    await db
      .update(agentProperties)
      .set({
        status: "REVOKED",
        updatedAt: new Date(),
      })
      .where(eq(agentProperties.id, agentPropertyId));

    await auditService.record({
      actorUserId: userId,
      action: "REVOKE_PROPERTY_ASSIGNMENT",
      entity: "AGENT_PROPERTY",
      entityId: agentPropertyId,
      oldValues: assignment,
      newValues: { ...assignment, status: "REVOKED" },
    });

    return {
      id: agentPropertyId,
      revoked: true,
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

    await auditService.record({
      actorUserId: userId,
      action: "SET_AGENT_PERMISSIONS",
      entity: "AGENT_PROPERTY",
      entityId: agentPropertyId,
      newValues: { permissions: uniquePermissions },
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

    await auditService.record({
      actorUserId: userId,
      action: "GRANT_AGENT_PERMISSION",
      entity: "AGENT_PROPERTY_PERMISSION",
      entityId: created.id,
      newValues: created,
    });

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

    await auditService.record({
      actorUserId: userId,
      action: "REVOKE_AGENT_PERMISSION",
      entity: "AGENT_PROPERTY_PERMISSION",
      entityId: existing.id,
      oldValues: existing,
    });

    return {
      permission,
      revoked: true,
    };
  },
};
