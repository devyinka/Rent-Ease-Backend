# RentEase Backend

RentEase is a Nigeria-focused property-management backend for landlords, agents, tenants, and technicians.

The backend is the source of truth for authentication, properties, units, tenancies, agent relationships, permissions, compensation, maintenance work orders, audit history, REST APIs, and realtime access. The mobile application must not connect directly to PostgreSQL.

Detailed product and architecture decisions are documented in [RENTEASE_BACKEND_BLUEPRINT (1).md](RENTEASE_BACKEND_BLUEPRINT%20%281%29.md).

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Drizzle ORM
- JWT authentication
- Socket.IO
- Zod validation

## Requirements

- Node.js 20+
- PostgreSQL

## Setup

```bash
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rentease
PORT=4000
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-secret
JWT_ISSUER=rentease-api
JWT_AUDIENCE=rentease-client
ALLOWED_ORIGINS=http://localhost:3000
```

Apply database migrations:

```bash
npm run db-migrate
```

## Development

```bash
npm run dev
```

The API runs at `http://localhost:4000` by default.

Health check:

```http
GET /health
```

## Scripts

| Command               | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Start the development server with reloads |
| `npm run build`       | Type-check and compile TypeScript         |
| `npm start`           | Start the compiled server                 |
| `npm run db-generate` | Generate a Drizzle migration              |
| `npm run db-migrate`  | Apply Drizzle migrations                  |

## API Areas

Current REST modules include:

- Authentication and sessions
- Property and unit management
- Tenant profiles and invitations
- Tenancy management
- Landlord-agent management
- Agent property permissions and compensation
- Maintenance work orders
- Audit history

Protected routes require authentication. Authorization is relationship-based: the backend checks ownership, active assignments, tenancy relationships, and property permissions.

## Project Structure

```text
src/
├── auth/          Authentication, JWT, sessions, password handling
├── controllers/   HTTP request handlers
├── db/            Drizzle connection and schema
├── middleware/    Authentication and authorization
├── routes/        Express routes and request schemas
├── services/      Business rules and database operations
├── realtime/      Socket.IO authentication and room access
└── types/         Domain types
```

## Development Rules

- Keep controllers thin.
- Put business rules in services.
- Validate request input with Zod.
- Never trust client-supplied ownership identifiers.
- Never return password hashes or private authentication fields.
- Preserve tenancy, financial, assignment, maintenance, and audit history.
- Run `npm run build` after changes.
