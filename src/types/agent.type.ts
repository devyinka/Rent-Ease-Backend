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

export type AgentPermission =
  | "VIEW_PROPERTY"
  | "MANAGE_PROPERTY"
  | "VIEW_UNITS"
  | "MANAGE_UNITS"
  | "VIEW_TENANTS"
  | "MANAGE_TENANTS"
  | "VIEW_FINANCIALS"
  | "COLLECT_RENT"
  | "MANAGE_MAINTENANCE"
  | "MANAGE_DOCUMENTS"
  | "SEND_REMINDERS"
  | "VIEW_REPORTS";

export type AgentCompensationType = "FIXED" | "PERCENTAGE";

export type AgentCompensationFrequency =
  | "ONE_TIME"
  | "MONTHLY"
  | "QUARTERLY"
  | "BI_ANNUAL"
  | "ANNUAL"
  | "PER_COLLECTION";

export interface CreateAgentCompensationInput {
  type: AgentCompensationType;
  value: string;
  frequency: AgentCompensationFrequency;
  effectiveFrom: Date;
  effectiveTo?: Date;
}
