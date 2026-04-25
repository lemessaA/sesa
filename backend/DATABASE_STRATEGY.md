# Database Strategy

## Primary Database

SESA uses **MongoDB** as the primary durable database.

- Production should point `MONGO_URI` to **MongoDB Atlas**.
- Local MongoDB is only for development, seeding, and offline testing.
- The backend now avoids silently defaulting to local MongoDB outside development and test environments.

## Secondary Store

SESA uses **Redis** for ephemeral state that should not live only in one Node.js process.

Production Redis is expected for:

- Socket.IO horizontal scaling
- Live stream coordination
- Collaboration room state
- AI tutor session continuity

When Redis is not configured, local development falls back to in-memory state for collaboration and AI tutor flows.

## Legacy Reference Normalization

Some legacy collections stored both `user/userId` and `course/courseId` fields during the smart-enrollment transition.

The codebase now keeps those aliases synchronized on `Payment` and `Progress` documents. To backfill older records, run:

```bash
npm run db:normalize-refs
```

Run the command from `backend/` after configuring MongoDB access.

## PostgreSQL

Do not treat PostgreSQL as an incremental swap for the current backend.

Revisit SQL only if the product roadmap requires a deliberate redesign around:

- stricter relational constraints
- finance-grade transactional guarantees
- heavier reporting and BI workloads
