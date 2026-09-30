# RentEase Backend Completion Checklist

> Temporary working checklist. Delete this file after the current backend milestone is complete.
>
> The permanent architecture reference is [RENTEASE_BACKEND_BLUEPRINT (1).md](RENTEASE_BACKEND_BLUEPRINT%20%281%29.md).

## Goal

Finish a stable backend MVP for:

- Authentication and sessions
- Landlords, agents, tenants, and technicians
- Properties and units
- Tenancies and invitations
- Agent assignments, permissions, and compensation
- Maintenance work orders
- Audit history
- REST API and secured realtime access

Payments, documents, notifications, reports, chat, and social login remain later phases.

---

## 1. Environment and Database

- [ ] Update `.env.example` to use the actual configuration names:
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `JWT_ISSUER`
  - `JWT_AUDIENCE`
  - `ALLOWED_ORIGINS`
  - `PORT`
- [ ] Review every generated Drizzle migration.
- [ ] Confirm migrations exist for technicians, work orders, audit logs, and revoked agent assignments.
- [ ] Apply migrations to the development database.
- [ ] Confirm the application starts against a clean database.
- [ ] Confirm foreign keys, unique constraints, indexes, and check constraints are present.
- [ ] Confirm no migration deletes historical tenancy, compensation, work-order, or audit data.

## 2. Authentication and Sessions

- [ ] Test registration for every supported role.
- [ ] Test login by email and phone.
- [ ] Test access-token expiry.
- [ ] Test expired database sessions.
- [ ] Test revoked sessions.
- [ ] Test logout invalidates the session.
- [ ] Test refresh-token rotation.
- [ ] Test concurrent refresh requests; only one request may win.
- [ ] Test refresh-token reuse revokes the session.
- [ ] Test JWT issuer, audience, algorithm, and payload validation.
- [ ] Confirm password hashes never appear in any response.
- [ ] Confirm suspended and deactivated users cannot authenticate.

## 3. Landlord, Agent, and Tenant Access

- [ ] Test landlord ownership across two landlords.
- [ ] Test agent access without a landlord relationship.
- [ ] Test agent access with a revoked landlord relationship.
- [ ] Test agent access without a property assignment.
- [ ] Test agent access without the required property permission.
- [ ] Test landlord access still works without agent permissions.
- [ ] Test tenant access to their own profile and tenancy.
- [ ] Test tenant access to another tenant's profile and tenancy.
- [ ] Test tenant management with `VIEW_TENANTS`.
- [ ] Test tenant management with `MANAGE_TENANTS`.
- [ ] Test tenancy management with `VIEW_TENANTS`.
- [ ] Test tenancy management with `MANAGE_TENANTS`.
- [ ] Test accepted tenant invitation is required before tenancy creation.
- [ ] Test an invitation from another landlord cannot authorize tenancy creation.

## 4. Property and Unit Management

- [ ] Validate all property request bodies with Zod.
- [ ] Validate all unit request bodies with Zod.
- [ ] Test property ownership on read, update, and delete.
- [ ] Test agent property permissions on read, update, and delete.
- [ ] Test unit permissions on list, create, read, update, and delete.
- [ ] Add ownership/permission predicates directly to unit update and delete queries.
- [ ] Verify duplicate unit numbers are rejected per property.
- [ ] Verify invalid UUIDs and invalid numeric values are rejected.
- [ ] Verify property and unit responses contain no private user fields.

## 5. Agent Management

- [ ] Test `GET /api/landlords/agents`.
- [ ] Test `GET /api/landlords/agents/:agentId`.
- [ ] Verify both `relationshipId` and `agentId` are returned.
- [ ] Verify revoked relationships remain visible as history where appropriate.
- [ ] Test agent invitation creation, expiry, acceptance, decline, and cancellation.
- [ ] Test invitation replay and concurrent acceptance.
- [ ] Test property assignment only accepts active relationships.
- [ ] Test revoked assignments no longer authorize agents.
- [ ] Test reassignment after revocation.
- [ ] Test all permission values are runtime-validated.
- [ ] Test compensation history remains after assignment revocation.
- [ ] Block new compensation on revoked assignments.

## 6. Maintenance and Work Orders

### Current foundation

- [x] Work-order table and technician relationship exist.
- [x] Landlord/agent work-order creation exists.
- [x] Technician work-order listing exists.
- [x] Technician assignment access middleware exists.
- [x] Work-order audit records exist.

### Remaining MVP workflow

- [ ] Add tenant maintenance request creation.
- [ ] Link a maintenance request to a tenancy, property, and optional unit.
- [ ] Add tenant maintenance request listing.
- [ ] Add landlord/agent request review.
- [ ] Add technician assignment and reassignment rules.
- [ ] Verify assigned users have the `TECHNICIAN` role.
- [ ] Add technician status transitions.
- [ ] Add tenant completion confirmation.
- [ ] Add tenant reopen action when the issue is unresolved.
- [ ] Add landlord/agent validation.
- [ ] Add final work-order closure.
- [ ] Define and enforce valid status transitions.
- [ ] Add `REOPENED`, `TENANT_CONFIRMED`, and `CLOSED` statuses if required by the final workflow.
- [ ] Enforce work-order authorization inside services, not only routes.
- [ ] Prevent technicians from reading or updating another technician's work order.
- [ ] Preserve work-order status history.

## 7. Audit and History

- [x] Audit-log table exists.
- [x] Audit service exists.
- [x] Property mutations record audit entries.
- [x] Tenancy mutations record audit entries.
- [x] Agent assignment and permission mutations record audit entries.
- [x] Work-order creation and status changes record audit entries.
- [ ] Add audit records for tenant invitation lifecycle.
- [ ] Add audit records for agent invitation lifecycle.
- [ ] Add audit records for unit mutations.
- [ ] Add audit records for compensation mutations.
- [ ] Ensure audit writes happen in the same transaction as critical mutations where possible.
- [ ] Never store passwords, refresh tokens, or raw invitation tokens in audit data.

## 8. Realtime Security

- [ ] Test Socket.IO handshake with a valid access token.
- [ ] Test invalid, expired, revoked, and inactive sessions.
- [ ] Test configured origin allowlisting.
- [ ] Test user-room authorization.
- [ ] Test property-room authorization for landlords.
- [ ] Test property-room authorization for agents with `VIEW_PROPERTY`.
- [ ] Test revoked agents cannot join property rooms.
- [ ] Add maintenance-room authorization only after maintenance relationships are finalized.
- [ ] Avoid logging tokens or private user data.

## 9. Error Handling and Validation

- [ ] Validate route UUID parameters with Zod where they are still unvalidated.
- [ ] Validate tenant profile updates.
- [ ] Validate tenant invitations.
- [ ] Validate agent profile updates.
- [ ] Validate compensation end dates.
- [ ] Validate work-order route parameters and transitions.
- [ ] Return consistent 400, 401, 403, 404, 409, and 500 responses.
- [ ] Do not expose stack traces or database details in production.
- [ ] Replace raw error logging with structured logging before production deployment.
- [ ] Confirm request body size and rate-limit settings are appropriate.

## 10. Tests and Verification

- [ ] Add a test runner and test script.
- [ ] Add authentication integration tests.
- [ ] Add authorization and IDOR tests.
- [ ] Add invitation lifecycle tests.
- [ ] Add property and unit ownership tests.
- [ ] Add tenancy relationship tests.
- [ ] Add agent permission tests.
- [ ] Add work-order isolation and transition tests.
- [ ] Add response-redaction tests.
- [ ] Add refresh-token concurrency tests.
- [ ] Run `npm run build`.
- [ ] Run the complete test suite.
- [ ] Run migrations against a clean test database.
- [ ] Manually verify the health endpoint and critical API flows.

## 11. Documentation and Release Readiness

- [ ] Keep `README.md` concise and setup-focused.
- [ ] Keep the blueprint as the architecture source of truth.
- [ ] Document all required environment variables.
- [ ] Document authentication headers and refresh flow.
- [ ] Document main REST endpoints.
- [ ] Document role and permission behavior.
- [ ] Document migration and deployment steps.
- [ ] Confirm production secrets are not committed.
- [ ] Confirm CORS origins are production-specific.
- [ ] Confirm database backups and rollback procedures.
- [ ] Confirm graceful shutdown for HTTP and Socket.IO.

## Definition of Done

The current backend milestone is complete when:

- [ ] All MVP routes are implemented.
- [ ] Every protected operation has service-level authorization.
- [ ] Every request body and important route parameter is validated.
- [ ] Work-order state transitions match the documented workflow.
- [ ] Historical records are preserved.
- [ ] Sensitive fields are never returned.
- [ ] Migrations apply cleanly to a fresh database.
- [ ] Security and integration tests pass.
- [ ] `npm run build` passes.
- [ ] README setup instructions work for a new developer.

## Deferred After This Milestone

Do not block this backend milestone on:

- Payments and Paystack integration
- Financial obligations and receipts beyond the current foundation
- Documents
- Email, SMS, and push notification providers
- Advanced reports
- Chat and conversation history
- Social login
- Multi-country support
- GraphQL completion
- Multiple-image media architecture
