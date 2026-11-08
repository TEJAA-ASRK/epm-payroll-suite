# Architecture and Technical Design

## Layers

1. **Presentation**: React components, responsive CSS design system, fetch-based API client.
2. **API**: Fastify route modules, authentication pre-handlers, Zod boundary validation, centralized error handler.
3. **Application/domain**: Payroll calculation rules, role policies, audit service behavior.
4. **Persistence**: Mongoose schemas/models with indexes, references, and atomic bulk writes.

## Reliability
Payroll upserts are idempotent on `(employeeId, period)` through a unique MongoDB compound index and atomic `bulkWrite` operations. The API returns explicit 4xx validation/auth errors and logs unexpected failures.

## Deployment
Build `apps/api` and `apps/web` independently. Serve the web static bundle through a CDN/reverse proxy and run the API as a container with MongoDB Atlas. Set `MONGODB_URI`, `JWT_SECRET`, `PORT`, and `WEB_ORIGIN` at runtime.

## Observability and controls
Fastify structured logs, `/health`, audit records, HTTPS at the edge, managed secrets, database backups, rate limiting, and alerting should be enabled in the deployment platform.
