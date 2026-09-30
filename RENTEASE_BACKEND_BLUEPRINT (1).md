# RentEase — Backend Product Blueprint

> **Purpose:** This document is the long-term engineering blueprint for RentEase. It is the source of truth for what the backend is being built toward, even if development continues with a different IDE, or chat.
>
> **Current focus:** Backend first. React Native frontend comes later.
>
> **Core principle:** RentEase is a property-management operating system, not primarily a property-listing marketplace.

---

# 1. Product Vision

RentEase is a Nigeria-focused property-management platform for landlords, agents, tenants, and technicians.

The core lifecycle is:

Property
↓
Units
↓
Tenancies
↓
Rent / Financial obligations
↓
Payments / Receipts
↓
Maintenance / Services
↓
Documents / Notifications / Reports
↓
History / Audit

The product should solve fragmented landlord/agent/tenant operations rather than simply displaying properties.

Future expansion can extend from Nigeria into other African markets.

---

# 2. Technology Direction

## Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- AWS for deployment/hosting
- REST API
- JWT/session-based authentication

## Mobile frontend

- React Native

## Planned infrastructure/services

- Cloudinary for image uploads
- Payment provider such as Paystack for future payment workflows
- Email/SMS notification providers later
- Possible realtime/chat provider later

The backend remains the application's source of truth.

The mobile application should NOT connect directly to PostgreSQL.

---

# 3. Roles

LANDLORD
AGENT
TENANT
TECHNICIAN

## LANDLORD

Owns properties and manages the overall property portfolio.

Responsibilities include:

- Create/manage properties
- Create/manage units
- Manage tenants
- Invite agents
- Assign agents to properties
- Configure agent permissions
- Configure agent compensation
- Manage rent/financial activity
- Manage maintenance
- View reports
- Manage documents
- Receive notifications

## AGENT

Works for one or multiple landlords.

An agent's access is determined by:

Agent
↓
Landlord relationship
↓
Property assignment
↓
Property permissions

An Agent may therefore have different permissions for different properties.

## TENANT

Tenant responsibilities include:

- View tenancy
- View rent obligations
- Make payments
- View receipts
- Submit maintenance requests
- Communicate with landlord/agent
- Confirm maintenance completion
- Receive notifications
- Manage relevant documents

## TECHNICIAN

Technicians are service providers assigned to maintenance/work orders.

Lifecycle:

Maintenance request
↓
Landlord/Agent assigns technician
↓
Technician works
↓
Technician marks completed
↓
Tenant confirms
↓
Landlord/Agent validates
↓
Work order closed

---

# 4. Core Architectural Principles

## 4.1 Authentication ≠ Authorization

Authentication answers:

> Who is this user?

Authorization answers:

> What is this user allowed to access?

Always enforce both.

---

## 4.2 Ownership and relationships matter

Do not authorize an Agent simply because:

user.role === "AGENT"

Authorization must consider:
agent
→ landlord relationship
→ property assignment
→ property permission
Likewise, Tenant access should be based on tenancy/property relationships.

## 4.3 Preserve historical records

Do not casually delete:

- Tenancies
- Payments
- Receipts
- Maintenance history
- Documents
- Audit history
- Financial records

A tenant leaving a property does not mean their historical tenancy should disappear.

## 4.4 Business rules belong in services

Controllers should be thin.

Preferred structure:

Route
↓
Controller
↓
Service
↓
Database

Middleware handles cross-cutting authorization where appropriate.

# 5. Current Database Architecture

## Users

users

Contains:

- id
- email
- phone
- passwordHash
- firstName
- lastName
- role
- status
- timestamps

Roles:

LANDLORD
AGENT
TENANT
TECHNICIAN

## Landlords

One landlord profile per user.

Relationship:
users 1 ─── 1 landlords

Landlord profile is created during registration.

## Agents

One Agent profile per user.

Relationship:
users 1 ─── 1 agents

Agent profile is created during registration.

## Properties

Belongs to a landlord.

landlord
↓
properties

Current important fields include:

- name
- address
- city
- state
- country
- description
- imageUrl
- timestamps

Property images are for identification and management, not merely marketplace listing.

## Units

Belongs to a property.

Important fields include:

- property-Id
- unitNumber
- unitType
- floor
- bedrooms
- bathrooms
- rentAmount
- rentFrequency
- serviceCharge
- depositAmount
- notes
- timestamps

MVP currently uses one `imageUrl` concept for property images and can later evolve to dedicated image tables if multiple images are needed.

## Tenants

One Tenant profile per user.

Tenant profile is created during registration.

Relationship:
users 1 ─── 1 Tenant

## Tenant Invitations

tenant_invitations

Used for landlord → tenant onboarding.

Lifecycle:

Invitation
↓
Tenant registration
↓
Tenant profile
↓
Tenancy

## Tenancies

Connect:

tenant
↓
tenancy
↓
unit
↓
property
↓
landlord

Rules:

- One ACTIVE tenancy per unit
- Preserve tenancy history
- PENDING → ACTIVE workflow
- Controlled end-tenancy workflow
- Do not casually delete historical tenancy records

---

## Authentication Sessions

auth_sessions

Stores refresh-token/session information.

# 6. Agent Architecture

Current Agent tables:

agents
landlord_agents
agent_properties
agent_property_permissions
agent_compensations

The intended hierarchy is:

USER
↓
AGENT
↓
LANDLORD RELATIONSHIP
↓
PROPERTY ASSIGNMENT
↓
PERMISSIONS
↓
COMPENSATION

# 7. Agent ↔ Landlord Relationship

An Agent can work for multiple landlords.

Example:

Agent A
├── Landlord 1
├── Landlord 2
└── Landlord 3

Therefore `agentId` and `landlordAgentId` are NOT interchangeable.

agents.id = the Agent

landlord_agents.id = a specific relationship between one Agent and one Landlord

Relationship statuses:

PENDING
ACTIVE
REVOKED

# 8. Agent Invitations

Agent invitation functionality has already been implemented and may be reviewed/refined later.

Expected conceptual lifecycle:

Landlord
↓
Invite Agent
↓
Agent invitation
↓
Agent receives notification
↓
Agent accepts
↓
landlord_agents
↓
ACTIVE

The invitation implementation should eventually be reviewed against the tenant invitation architecture for consistency.

Potential invitation infrastructure:

- Email provider
- SMS provider
- Notification service/provider adapter

Business logic should remain provider-agnostic.

---

# 9. CURRENT AGENT BACKEND PROGRESS

## Completed / being implemented

### Agent profile

GET /api/agents/me
PATCH /api/agents/me

Service responsibilities:

getMyProfile()
updateMyProfile()

Agent profile is created during registration.

## Agent relationship methods

Agent-side methods have been designed/implemented:

getMyLandlords()
getLandlordRelationship()
acceptRelationship()
revokeRelationship()

Potential routes:

GET /api/agents/landlords
GET /api/agents/landlords/:relationshipId
PATCH /api/agents/landlords/:relationshipId/accept
PATCH /api/agents/landlords/:relationshipId/revoke

These must always verify that the relationship belongs to the authenticated Agent.

# 10. IMMEDIATE NEXT WORK

The next implementation is NOT property assignment yet.

The immediate missing piece is the **Landlord-side Agent management API**.

The frontend needs to display the landlord's agents in a dropdown/list.

Therefore:

LANDLORD````
↓
GET /api/landlords/agents
↓
Agent list
↓
Frontend dropdown
↓
Landlord selects Agent
↓
agentId sent to backend

Important:

The frontend should NOT send `landlordId` for operations where the authenticated landlord is already known.

The backend derives the landlord from:

req.user.id
↓
landlords.userId
↓
landlord.id

# 11. Landlord Agent API

Build:

GET /api/landlords/agents
GET /api/landlords/agents/:agentId
POST /api/landlords/agents/invite

Potential later operations:

PATCH /api/landlords/agents/:agentId
DELETE /api/landlords/agents/:agentId

# 12. GET All Agents for a Landlord

Database relationship:

landlord
↓
landlord_agents
↓
agents
↓
users

The endpoint should return enough information for the frontend to display a useful Agent selector.

Example response shape:

```json
{
  "success": true,
  "data": [
    {
      "relationshipId": "relationship-uuid",
      "agentId": "agent-uuid",
      "status": "ACTIVE",
      "firstName": "Dev",
      "lastName": "Yinka",
      "email": "Devyinka8380@gmail.com",
      "phone": "080..."
    }
  ]
}
```

Both IDs are intentional:

relationshipId
agentId

They represent different concepts.

# 13. Agent Selection Flow

Frontend:

GET /api/landlords/agents

Display:

Select Agent

salam sodiq
olay yimika
dev yinka

Frontend internally keeps:

agentId

When landlord selects an Agent:

```http
POST /api/landlords/agents/invite
```

Example:

```json
{
  "agentId": "agent-uuid"
}
```

The backend determines the landlord from the authenticated session.

Never trust a client-provided landlordId when the authenticated user already determines it.

# 14. Property Assignment

After the Landlord ↔ Agent relationship is ACTIVE:

Landlord
↓
ACTIVE landlord-agent relationship
↓
Assign property
↓
agent_properties

Critical service rule:

`agent_properties` must only connect:

ACTIVE landlord-agent relationship

to:

a property actually owned by that landlord

Because the database foreign keys alone do not guarantee:

landlordAgents.landlordId === properties.landlordId

The service must enforce this.

# 15. Agent Property Assignment API

Expected future endpoints:

GET /api/landlords/agents/:agentId/properties
POST /api/landlords/agents/:agentId/properties
DELETE /api/landlords/agents/:agentId/properties/:propertyId

Potential request:

```json
{
  "propertyId": "property-uuid"
}
```

The backend should derive the landlord from the authenticated session and verify:

1. Authenticated user is LANDLORD
2. Landlord exists
3. Agent exists
4. Agent relationship belongs to landlord
5. Relationship is ACTIVE
6. Property belongs to landlord
7. Property isn't already assigned to that relationship

---

# 16. Agent Permissions

Current permissions:

VIEW_PROPERTY
MANAGE_PROPERTY

VIEW_UNITS
MANAGE_UNITS

VIEW_TENANTS
MANAGE_TENANTS

VIEW_FINANCIALS
COLLECT_RENT

MANAGE_MAINTENANCE
MANAGE_DOCUMENTS
SEND_REMINDERS
VIEW_REPORTS

Permissions are property-specific.

Example:

Agent
├── Property A
│ ├── VIEW_PROPERTY
│ ├── VIEW_UNITS
│ └── VIEW_TENANTS
│
└── Property B
├── VIEW_PROPERTY
├── MANAGE_UNITS
├── COLLECT_RENT
└── MANAGE_MAINTENANCE

There is no assumption that an Agent has the same permissions across all landlords/properties.

# 17. Permission API

Future:

GET /api/landlords/agents/:agentId/properties/:propertyId/permissions

PATCH /api/landlords/agents/:agentId/properties/:propertyId/permissions

The service must verify:

Landlord owns property
AND
Agent relationship belongs to landlord
AND
Agent is assigned to property

---

# 18. Agent Compensation

Agent compensation is separate from tenant rent.

There are three distinct financial concepts:

### Tenant rent

Belongs economically to the landlord.

Tenant
↓
Rent
↓
Landlord

### Tenant-facing letting/agency fee

A tenant may pay an agent fee when entering a tenancy.

Default/configuration:

agent_properties

Snapshot on tenancy:

tenancies

### Landlord → Agent compensation

Separate compensation for management/caretaking/etc.

Stored in:

agent_compensations

Types:
FIXED
PERCENTAGE

Frequencies:
ONE_TIME
MONTHLY
QUARTERLY
BI_ANNUAL
ANNUAL
PER_COLLECTION

Never mix landlord rent with Agent revenue.

---

# 19. Agent Compensation API

Future:

GET /api/landlords/agents/:agentId/properties/:propertyId/compensation

POST /api/landlords/agents/:agentId/properties/:propertyId/compensation

PATCH /api/landlords/agents/:agentId/properties/:propertyId/compensation/:compensationId

Validate:

- compensation type
- value >= 0
- valid frequency
- effectiveFrom/effectiveTo
- correct landlord
- correct Agent relationship
- correct property assignment

---

# 20. Financial Architecture — Future

Do NOT build a giant `damageFee`, `cautionFee`, etc. into the core schema.

Eventually use generic financial obligations.

Possible types:
RENT
SECURITY_DEPOSIT
SERVICE_CHARGE
LETTING_FEE
LEGAL_FEE
OTHER

Then:
financial_obligations
↓
payments
↓
payment_allocations
↓
receipts

This is more flexible than creating a new database column for every financial concept.

---

# 21. Security Deposit / Damage — Future

Conceptual workflow:

Tenant pays security deposit
↓
Deposit ledger
↓
No damage
↓
Release

OR

Damage reported
↓
Evidence
↓
Proposed deduction
↓
Tenant notified
↓
Agree / dispute
↓
Settlement

Damage is an assessed deduction, not a fixed generic `damageFee` field.

Investment of tenant deposits is a future feature requiring appropriate regulated financial partners and legal/regulatory review.

---

# 22. Maintenance Architecture — Future

Core workflow:
Tenant
↓
Maintenance request
↓
Landlord / Agent
↓
Assign technician
↓
Technician works
↓
Technician marks done
↓
Tenant confirms
├── Confirmed
│ ↓
│ Landlord/Agent validates
│ ↓
│ Closed
│
└── Not resolved
↓
Reopened

Technicians must only access work orders assigned to them.

---

# 23. Chat — Future

In-app chat should be similar conceptually to WhatsApp but remain inside RentEase.

Tenant chat routing:

Tenant
↓
Property tenancy
↓
Assigned Agent?
├── YES → Agent
└── NO → Landlord

Possible future architecture:

REST API
↓
Conversation/message history

Realtime provider/WebSocket
↓
Live message delivery

PostgreSQL
↓
Source of truth / message records

Possible providers to evaluate later:

- Stream Chat
- Sendbird
- Twilio
- Firebase
- Ably
- Pusher

Selection should consider:

- React Native support
- Pricing
- Nigeria/Africa suitability
- Offline behavior
- Media support
- Message history
- Data ownership
- Vendor lock-in

Do not build chat before the core property/tenancy/financial architecture is stable.

# 24. Social Login — Future

Google and Apple sign-in are planned.

Current `users.passwordHash` is nullable, allowing social-auth architecture.

Eventually consider:

user_auth_providers

with providers such as:
EMAIL_PASSWORD
GOOGLE
APPLE

Support account linking safely.

# 25. Image Architecture

Property image:

React Native
↓
Cloudinary direct upload
↓
secure_url
↓
Express API
↓
PostgreSQL

Backend should store the URL rather than receiving the image through the API when direct upload is used.

For MVP:

properties.imageUrl
units.imageUrl

Later, if multiple images become necessary:

property_images
unit_images

---

# 26. Reports

Reports are a core landlord feature.

Eventually include things such as:

Occupancy
Vacancy
Rent collection
Outstanding rent
Tenant turnover
Property performance
Maintenance spending
Agent activity
Income/expenses
Tenancy expiry

Agent reports should respect permissions.

---

# 27. Notifications

Notification categories:

Rent due
Rent overdue
Tenancy ending
Maintenance update
Invitation
Agent assignment
Payment received
Payment failed
Document update
Chat message

Notification delivery should eventually support:
In-app
Email
SMS
Push notification

Keep provider implementations behind a notification service/interface.

# 28. Audit / History

A serious property-management system needs an audit trail.

Future architecture:
audit_logs

Potential information:
actor
action
entity
entityId
old values
new values
timestamp
metadata

Important actions:

- property changes
- unit changes
- tenancy changes
- agent assignment
- permission changes
- payment actions
- maintenance status changes
- document changes

---

# 29. Middleware / Authorization Direction

Expected reusable middleware/services:

requireAuth
requireRole
requirePropertyOwner
requireAgentPropertyAccess
requireAgentPermission
requireTenantAccess
requireTechnicianWorkOrderAccess

Do not duplicate authorization logic across every controller.

Prefer reusable relationship/access services.

---

# 30. Backend Folder Direction

Preferred structure:

```text
src/
├── auth/
│   ├── auth.MiddleWare.ts
│   ├── auth.service.ts
│   ├── auth.type.ts
│   ├── Jwt.ts
│   └── password.ts
│
├── controllers/
│   ├── agent.controller.ts
│   ├── landlord.controller.ts
│   ├── property.controller.ts
│   ├── tenant.controller.ts
│   ├── tenancy.controller.ts
│   └── ...
│
├── db/
│   ├── index.ts
│   └── schema.ts
│
├── errors/
│   └── appError.ts
│
├── middleware/
│   ├── property-access.middleware.ts
│   └── ...
│
├── routes/
│   ├── agent.route.ts
│   ├── landlord.route.ts
│   ├── property.route.ts
│   ├── tenant.route.ts
│   ├── tenancy.route.ts
│   └── ...
│
├── services/
│   ├── agent.service.ts
│   ├── landlord.service.ts
│   ├── property.service.ts
│   ├── tenant.service.ts
│   ├── tenancy.service.ts
│   └── ...
│
└── types/
    ├── agent.type.ts
    ├── property.type.ts
    ├── tenant.type.ts
    ├── tenancy.type.ts
    └── ...
```

Follow the existing project's actual naming conventions where they differ.

---

# 31. Current Backend Status

Authentication ✅
Users ✅
Landlord profile ✅
Tenant profile ✅
Property ✅
Unit ✅
Tenancy ✅
Property image support ✅
Agent schema ✅
Agent registration profile ✅
Agent profile API ✅
Agent relationship API ✅
Agent invitation ✅

Next:
Landlord Agent management API ← CURRENT
↓
Agent property assignment
↓
Agent permissions
↓
Agent compensation
↓
Agent access middleware
↓
Testing/review

---

# 32. Current Immediate Task

Implement the Landlord-side Agent module.

### First:

GET /api/landlords/agents

Purpose:

Return Agents associated with the authenticated landlord.

### Second:

GET /api/landlords/agents/:agentId

Purpose:

Return one Agent and the landlord relationship.

### Third:

Review the already-existing invitation endpoint:

POST /api/landlords/agents/invite

Ensure it uses:

authenticated landlord

- agentId/email/phone according to existing design

and does not trust a client-supplied landlord ID.

---

# 33. Development Workflow

Do not blindly generate the whole application.

For each module:

1. Understand business rule
2. Review schema
3. Define types
4. Write service
5. Write controller
6. Write route
7. Add middleware/authorization
8. Build/type-check
9. Test endpoint
10. Review edge cases
11. Commit
12. Move to next module

```

---

# 34. AI-Assisted Development Rules

AI assistants are implementation tools, not the source of architectural truth.

Before asking an AI to modify code:

1. Give it this blueprint.
2. Tell it to inspect existing code first.
3. Tell it not to modify unrelated modules.
4. Ask it to explain intended changes before large refactors.
5. Preserve existing business rules.
6. Never accept generated authorization logic without reviewing it.
7. Never assume generated code is correct because TypeScript compiles.
8. Run tests/type-check after changes.

Useful instruction:

> Read RENT_EASE_BACKEND_BLUEPRINT.md before making changes. Inspect the existing implementation and follow its current conventions. Do not redesign the architecture unless explicitly requested. Explain the files and business rules you intend to change before making a large change.

---

# 35. Definition of Done for RentEase Backend

The backend is not "done" simply because all endpoints return 200.

A module is done when:

Schema
   ↓
Business rules
   ↓
Authorization
   ↓
Validation
   ↓
Service
   ↓
Controller
   ↓
Route
   ↓
Error handling
   ↓
Database constraints
   ↓
Tests
   ↓
Edge cases
   ↓
Audit/history implications
```

have been considered.

---

# 36. Long-Term Product Map

PHASE 1 — FOUNDATION
├── Authentication
├── Users
├── Roles
├── Sessions
└── Security

PHASE 2 — PROPERTY CORE
├── Landlords
├── Properties
├── Units
└── Property images

PHASE 3 — TENANCY
├── Tenant invitations
├── Tenants
├── Tenancies
└── Tenancy history

PHASE 4 — AGENTS
├── Agent profiles
├── Agent invitations
├── Landlord-agent relationships
├── Property assignments
├── Permissions
└── Compensation

PHASE 5 — FINANCIALS
├── Obligations
├── Rent
├── Deposits
├── Payments
├── Allocations
├── Receipts
└── Settlements

PHASE 6 — MAINTENANCE
├── Requests
├── Work orders
├── Technicians
├── Completion
├── Tenant confirmation
└── Validation

PHASE 7 — OPERATIONS
├── Documents
├── Notifications
├── Reports
├── Audit logs
└── Activity history

PHASE 8 — COMMUNICATION
├── In-app chat
├── Realtime messaging
├── Push notifications
├── Email
└── SMS

PHASE 9 — PAYMENTS / SERVICES
├── Paystack
├── Rent payments
├── Agent compensation
├── Utility payments
└── Service-provider workflows

PHASE 10 — ADVANCED
├── Analytics
├── Financial products through regulated partners
├── Multi-company management
├── Advanced reporting
├── Multi-country support
└── Africa expansion

---

# 37. Non-Negotiable Product Rules

1. RentEase is property-management software, not primarily a listing marketplace.

2. Backend is the source of truth.

3. Never trust client-supplied ownership identifiers when the authenticated
   user's identity can determine ownership.

4. Role alone is insufficient for authorization.

5. Agent access is relationship + property assignment + permission based.

6. Preserve financial and tenancy history.

7. Do not conflate landlord money, tenant money, and agent compensation.

8. Do not add one-off financial columns when a generic financial-obligation
   model will scale better.

9. Provider integrations should be behind service/provider abstractions.

10. Avoid premature complexity, but do not sacrifice core data integrity
    and authorization for convenience.

11. Every major module must be reviewed for authorization and historical
    implications before being considered complete.

12. AI-generated code must be reviewed by the developer before being trusted.

---

# 38. Current Next Command

When continuing development, start here:

Implement the Landlord-side Agent management API.

First inspect the existing landlord implementation, authentication,
authorization, schema, and current Agent invitation implementation.

Then implement:

GET /api/landlords/agents

The authenticated landlord must be determined from req.user.id.
Do not accept landlordId from the client.

Return the landlord's Agent relationships with enough Agent/user
information for the frontend to display an Agent selector.

Follow the existing project architecture and coding conventions.
Do not modify unrelated modules.

---

# 39. Final Architectural Goal

The finished RentEase system should conceptually look like:

                         RENT EASE
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
       LANDLORD            AGENT              TENANT
          │                  │                  │
          │                  │                  │
          └──────────┬───────┘                  │
                     │                          │
              PROPERTY MANAGEMENT               │
                     │                          │
                PROPERTIES                      │
                     │                          │
                   UNITS                        │
                     │                          │
                 TENANCIES ─────────────────────┘
                     │
          ┌──────────┼───────────┐
          │          │           │
        RENT      DEPOSITS   MAINTENANCE
          │          │           │
      PAYMENTS   SETTLEMENT   TECHNICIAN
          │
       RECEIPTS
          │
       REPORTS
          │
       AUDIT
          │
      NOTIFICATIONS
          │
        CHAT

The goal is not simply to have many tables and endpoints.

The goal is to build a coherent property-management operating system where every relationship, financial event, permission, and operational action has a clear owner, history, and authorization path.
