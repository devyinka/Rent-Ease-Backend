import type {
  Agent,
  LandlordAgent,
  AgentProperty,
  AgentPropertyPermission,
  AgentCompensation,
  AgentInvitation,
} from "../db/schema.js";

export type {
  Agent,
  LandlordAgent,
  AgentProperty,
  AgentPropertyPermission,
  AgentCompensation,
  AgentInvitation,
};

export interface UpdateAgentInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CreateAgentInvitationInput {
  email?: string;
  phone?: string;
}

export interface AssignPropertyInput {
  landlordAgentId: string;
  propertyId: string;
}

export interface RevokeAgentRelationshipInput {
  relationshipId: string;
}
