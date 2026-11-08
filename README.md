# Payflow Enterprise

Enterprise Employee Payroll Management System with a React/Vite web application, Fastify REST API, ARM-safe embedded file database, role-based access control, audit logging, payroll processing, and responsive corporate UI.

## Architecture

```text
apps/web (React + Vite)  ->  apps/api (Fastify REST + JWT)  ->  Embedded file database
```

The application is intentionally a workspace monorepo. Local development requires no database server, credentials, or Atlas account. Data is persisted in `apps/api/data` using a JavaScript embedded datastore that works on Windows ARM64. MongoDB remains a straightforward production migration path.

## Quick start

Requirements: Node.js 20+ and npm 10+.

```powershell
Copy-Item .env.example apps/api/.env
npm install
npm run db:seed
npm run dev
```

Open http://localhost:5173. Demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@acme-payroll.com | Password123! |
| HR | hr@acme-payroll.com | Password123! |
| Employee | employee@acme-payroll.com | Password123! |

## Commands

`npm run dev` starts web and API together. `npm run build` performs both TypeScript builds. `npm test` runs API unit tests. `npm run db:seed` inserts safe demo data.

## Security and operations

- JWT authentication with role authorization for Admin, HR, and Employee.
- Passwords are bcrypt-hashed; secrets are environment variables.
- Helmet, CORS, Zod request validation, Mongoose query handling, structured Fastify logging, and centralized error handling.
- Audit events cover authentication, employee creation, leave decisions, and payroll processing.
- For production: migrate the repository adapter to MongoDB Atlas, use a managed secret store, HTTPS termination, rate limiting/WAF, backups, observability, and a PDF worker for signed payslip generation.

## Product scope

Included: authentication, RBAC, employee directory, attendance workspace, leave submission and approval, payroll processing with tax/deduction calculations, payroll history, dashboards, reports entry points, filtering/search, audit logs, migrations, seed data, tests, and technical documentation.

## Documentation

- [SRS](docs/SRS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [UML and ER diagrams](docs/DIAGRAMS.md)

## GitHub workflow

The repository includes GitHub Actions in `.github/workflows/ci.yml`. Every push and pull request builds both applications and runs the API tests.

To publish this project:

```powershell
git init
git add .
git commit -m "Initial enterprise payroll platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/epm-payroll-suite.git
git push -u origin main
```

Do not commit `.env` or `apps/api/data`; both are ignored because they may contain secrets or local runtime data.
