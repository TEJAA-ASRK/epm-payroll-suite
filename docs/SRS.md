# Software Requirements Specification

## 1. Purpose
Payflow Enterprise centralizes employee identity, attendance, leave, compensation, payroll processing, and compliance auditability for mid-market organizations.

## 2. Actors
**Admin** manages access, employees, payroll, and audit records. **HR** manages employees, leave, and payroll. **Employee** views their profile/pay history and submits leave.

## 3. Functional requirements

| ID | Requirement | Acceptance |
|---|---|---|
| FR-01 | Authenticate users | Valid credentials produce a signed session; invalid credentials are rejected. |
| FR-02 | Enforce roles | Restricted endpoints return 403 for unauthorized roles. |
| FR-03 | Manage employees | HR/Admin can create and search active employee records. |
| FR-04 | Manage leave | Employees submit dated requests; HR/Admin approve or reject. |
| FR-05 | Process payroll | HR/Admin process a YYYY-MM period idempotently per employee. |
| FR-06 | View payroll | Employees see only their own records; HR/Admin see all. |
| FR-07 | Audit activity | Security-sensitive actions are recorded with actor, entity, and timestamp. |
| FR-08 | Report workforce data | UI provides report entry points and export-ready data surfaces. |

## 4. Non-functional requirements
Accessibility-conscious semantic controls, responsive layouts from 360px upward, API validation at the boundary, password hashing, least-privilege authorization, transactional payroll writes, deterministic seed data, and build/test automation.

## 5. Business rules
Monthly gross salary equals annual base salary / 12. Current baseline tax is 18% and standard deductions are 5%. Payroll is unique by employee and period. Leave end date cannot precede start date. Terminated employees are excluded from payroll.

## 6. Future production extensions
Country-specific tax engines, configurable salary components, attendance imports, PDF payslip rendering, SSO/SAML, MFA, approval policies, notifications, and PostgreSQL read replicas.
