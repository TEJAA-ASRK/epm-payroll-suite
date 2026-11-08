# REST API

Base URL: `http://localhost:4000/api`. Protected calls use `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Sign in with email/password |
| GET | `/auth/me` | Authenticated | Resolve current user |
| GET | `/dashboard` | Authenticated | KPI and recent activity data |
| GET | `/employees` | Admin, HR | Search employee directory |
| GET | `/employees/me` | Authenticated | Current employee profile |
| POST | `/employees` | Admin, HR | Create employee and user |
| GET | `/leave` | Authenticated | Own/all leave requests by role |
| POST | `/leave` | Authenticated employee | Submit leave request |
| PATCH | `/leave/:id` | Admin, HR | Approve or reject leave |
| GET | `/payroll` | Authenticated | Own/all payroll records by role |
| POST | `/payroll/process` | Admin, HR | Process a `YYYY-MM` payroll period |
| GET | `/audit` | Admin | Latest audit entries |

All payloads are validated server-side. Errors use HTTP status codes 400, 401, 403, 404, 409, or 500 with a descriptive message.
