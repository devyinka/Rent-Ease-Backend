import { and, eq, inArray } from "drizzle-orm";

import { db } from "../db/index.js";
import {
  agentCompensations,
  agentProperties,
  agentPropertyPermissions,
  agents,
  landlordAgents,
  users,
} from "../db/schema.js";

import { AppError } from "../errors/appError.js";

import type { AgentPermission, UpdateAgentInput } from "../types/agent.type.js";

export const agentService = {
  // GET MY PROFILE
  getMyProfile: async (userId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
            user: {
              columns: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
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
            user: {
              columns: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!relationship) {
      throw new AppError("Landlord relationship not found", 404);
    }

    return relationship;
  },

  // GET MY ASSIGNED PROPERTIES
  getMyProperties: async (userId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    // GET ACTIVE LANDLORD RELATIONSHIPS
    const relationships = await db.query.landlordAgents.findMany({
      where: and(
        eq(landlordAgents.agentId, agent.id),
        eq(landlordAgents.status, "ACTIVE"),
      ),
      columns: {
        id: true,
      },
    });

    const relationshipIds = relationships.map(
      (relationship) => relationship.id,
    );

    // NO ACTIVE LANDLORDS
    if (relationshipIds.length === 0) {
      return [];
    }

    // GET ASSIGNED PROPERTIES
    const properties = await db.query.agentProperties.findMany({
      where: inArray(agentProperties.landlordAgentId, relationshipIds),
      with: {
        property: true,

        landlordAgent: {
          with: {
            landlord: {
              with: {
                user: {
                  columns: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },

        permissions: true,
        compensations: true,
      },

      orderBy: (agentProperties, { desc }) => desc(agentProperties.createdAt),
    });

    return properties;
  },

  // GET MY ASSIGNED PROPERTY
  getMyProperty: async (userId: string, agentPropertyId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const agentProperty = await db.query.agentProperties.findFirst({
      where: eq(agentProperties.id, agentPropertyId),

      with: {
        property: true,

        landlordAgent: {
          with: {
            landlord: {
              with: {
                user: {
                  columns: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },

        permissions: true,
        compensations: true,
      },
    });

    // HIDE EXISTENCE OF UNAUTHORIZED ASSIGNMENTS
    if (!agentProperty) {
      throw new AppError("Agent property not found", 404);
    }

    // VERIFY THIS PROPERTY BELONGS TO THIS AGENT
    if (agentProperty.landlordAgent.agentId !== agent.id) {
      throw new AppError("Agent property not found", 404);
    }

    // VERIFY ACTIVE LANDLORD RELATIONSHIP
    if (agentProperty.landlordAgent.status !== "ACTIVE") {
      throw new AppError("Agent property not found", 404);
    }

    return agentProperty;
  },

  getAssignment: async (userId: string, propertyId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const assignments = await db.query.agentProperties.findMany({
      where: eq(agentProperties.propertyId, propertyId),
      with: {
        landlordAgent: true,
        property: true,
        permissions: true,
        compensations: true,
      },
    });

    const assignment = assignments.find(
      (item) =>
        item.landlordAgent.agentId === agent.id &&
        item.landlordAgent.status === "ACTIVE",
    );

    if (!assignment) {
      throw new AppError("You do not have access to this property", 403);
    }

    return assignment;
  },

  // CHECK PERMISSION
  hasPermission: async (
    userId: string,
    propertyId: string,
    permission: AgentPermission,
  ) => {
    const assignment = await agentService.getAssignment(userId, propertyId);

    return assignment.permissions.some(
      (item) => item.permission === permission,
    );
  },

  // REQUIRE PERMISSION
  requirePermission: async (
    userId: string,
    propertyId: string,
    permission: AgentPermission,
  ) => {
    const assignment = await agentService.getAssignment(userId, propertyId);

    const hasPermission = assignment.permissions.some(
      (item) => item.permission === permission,
    );

    if (!hasPermission) {
      throw new AppError(
        `You do not have the ${permission} permission for this property`,
        403,
      );
    }

    return assignment;
  },

  // GET MY PERMISSIONS
  getMyPermissions: async (userId: string, agentPropertyId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const assignment = await db.query.agentProperties.findFirst({
      where: eq(agentProperties.id, agentPropertyId),
      with: {
        landlordAgent: true,
        permissions: true,
      },
    });

    if (!assignment) {
      throw new AppError("Agent property not found", 404);
    }

    if (
      assignment.landlordAgent.agentId !== agent.id ||
      assignment.landlordAgent.status !== "ACTIVE"
    ) {
      throw new AppError("Agent property not found", 404);
    }

    return assignment.permissions;
  },

  // GET MY ACCESS DETAILS
  getMyAccess: async (userId: string, agentPropertyId: string) => {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });

    if (!agent) {
      throw new AppError("Agent profile not found", 404);
    }

    const assignment = await db.query.agentProperties.findFirst({
      where: eq(agentProperties.id, agentPropertyId),
      with: {
        landlordAgent: true,
        property: true,
        permissions: true,
        compensations: true,
      },
    });

    if (!assignment) {
      throw new AppError("Agent property not found", 404);
    }

    if (
      assignment.landlordAgent.agentId !== agent.id ||
      assignment.landlordAgent.status !== "ACTIVE"
    ) {
      throw new AppError("Agent property not found", 404);
    }

    return {
      agentPropertyId: assignment.id,
      property: assignment.property,
      permissions: assignment.permissions,
      compensations: assignment.compensations,
    };
  },
};
