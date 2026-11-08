import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import jwt from "@fastify/jwt";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { audits, employees, findEmployee, findUser, initializeDatabase, leaves, payroll, users, clean, userForEmployee } from "./local-db.js";

type Role = "ADMIN" | "HR" | "EMPLOYEE";
const app = Fastify({ logger: true });
declare module "@fastify/jwt" { interface FastifyJWT { user: { id: string; role: Role; email: string; employeeId?: string } } }
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" });
await app.register(helmet); await app.register(sensible); await app.register(jwt, { secret: process.env.JWT_SECRET ?? "dev-only-secret-change-me" });
const auth = async (request: FastifyRequest, reply: FastifyReply) => { try { await request.jwtVerify(); } catch { return reply.unauthorized("Authentication required"); } };
const roles = (...allowed: Role[]) => async (request: FastifyRequest, reply: FastifyReply) => { await auth(request, reply); if (!allowed.includes(request.user.role)) return reply.forbidden("Insufficient permissions"); };
const audit = (userId: string | undefined, action: string, entity: string, entityId?: string, metadata?: unknown) => audits.insert({ userId, action, entity, entityId, metadata, createdAt: new Date().toISOString() });
const id = (doc: any) => doc?._id ?? doc?.id;

app.get("/health", async () => ({ status: "ok", service: "epm-api", database: "embedded-file", timestamp: new Date().toISOString() }));
app.post("/api/auth/login", async (request, reply) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(request.body);
  if (!parsed.success) return reply.badRequest("Enter a valid email and password");
  const user = await users.findOne({ email: parsed.data.email }); const employee = user ? await employees.findOne({ userId: user._id }) : null;
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return reply.unauthorized("Invalid credentials");
  const token = await reply.jwtSign({ id: user._id, email: user.email, role: user.role, employeeId: employee?._id });
  await audit(user._id, "LOGIN", "User", user._id); return { token, user: { ...clean(user), passwordHash: undefined, employeeId: employee?._id } };
});
app.get("/api/auth/me", { preHandler: auth }, async (request, reply) => { const user = await findUser(request.user.id); const employee = user ? await employees.findOne({ userId: user._id }) : null; if (!user) return reply.notFound("User not found"); return { ...clean(user), passwordHash: undefined, employeeId: employee?._id }; });
app.get("/api/dashboard", { preHandler: auth }, async () => {
  const period = new Date().toISOString().slice(0, 7); const allEmployees = await employees.find({ employmentStatus: "ACTIVE" }); const pending = await leaves.count({ status: "PENDING" }); const records = await payroll.find({ period }); const recentAudit = (await audits.find({}).sort({ createdAt: -1 }).limit(8)).map(clean);
  return { stats: { employees: allEmployees.length, pendingLeaves: pending, monthlyPayroll: records.reduce((sum: number, item: any) => sum + item.netSalary, 0) }, recentAudit };
});
app.get("/api/employees", { preHandler: roles("ADMIN", "HR") }, async (request) => {
  const query = z.object({ search: z.string().optional(), department: z.string().optional() }).parse(request.query); let result = await employees.find({ employmentStatus: { $ne: "TERMINATED" } }).sort({ createdAt: -1 });
  if (query.department) result = result.filter((item: any) => item.department === query.department);
  for (const item of result) { item.user = await userForEmployee(item); } if (query.search) result = result.filter((item: any) => JSON.stringify(item).toLowerCase().includes(query.search!.toLowerCase())); return result.map(clean);
});
app.get("/api/employees/me", { preHandler: auth }, async (request, reply) => { const employee = await employees.findOne({ userId: request.user.id }); if (!employee) return reply.notFound("Employee profile not found"); employee.user = await userForEmployee(employee); return clean(employee); });
app.post("/api/employees", { preHandler: roles("ADMIN", "HR") }, async (request, reply) => {
  const parsed = z.object({ name: z.string().min(2), email: z.string().email(), department: z.string().min(2), designation: z.string().min(2), baseSalary: z.number().positive(), phone: z.string().min(7), address: z.string().min(5) }).safeParse(request.body);
  if (!parsed.success) return reply.badRequest(JSON.stringify(parsed.error.flatten())); const data = parsed.data; const user = await users.insert({ name: data.name, email: data.email, role: "EMPLOYEE", passwordHash: await bcrypt.hash("Welcome123!", 12), createdAt: new Date().toISOString() });
  const employee = await employees.insert({ userId: user._id, employeeNumber: `EMP-${Date.now().toString().slice(-6)}`, ...data, bankAccountLast4: "0000", dateOfJoining: new Date().toISOString(), employmentStatus: "ACTIVE", createdAt: new Date().toISOString() }); await audit(request.user.id, "CREATE", "Employee", employee._id); return reply.code(201).send(clean(employee));
});
app.get("/api/leave", { preHandler: auth }, async (request) => { const filter = request.user.role === "EMPLOYEE" ? { employeeId: request.user.employeeId } : {}; const result = await leaves.find(filter).sort({ createdAt: -1 }); for (const item of result) { item.employee = await findEmployee(item.employeeId); if (item.employee) item.employee.user = await userForEmployee(item.employee); } return result.map(clean); });
app.post("/api/leave", { preHandler: auth }, async (request, reply) => { if (!request.user.employeeId) return reply.badRequest("Employee profile required"); const parsed = z.object({ type: z.string().min(2), startDate: z.coerce.date(), endDate: z.coerce.date(), reason: z.string().min(5) }).safeParse(request.body); if (!parsed.success || parsed.data.endDate < parsed.data.startDate) return reply.badRequest("Invalid leave dates or reason"); const leave = await leaves.insert({ ...parsed.data, employeeId: request.user.employeeId, status: "PENDING", createdAt: new Date().toISOString() }); await audit(request.user.id, "CREATE", "LeaveRequest", leave._id); return reply.code(201).send(clean(leave)); });
app.patch("/api/leave/:id", { preHandler: roles("ADMIN", "HR") }, async (request, reply) => { const parsed = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).safeParse(request.body); if (!parsed.success) return reply.badRequest("Status must be APPROVED or REJECTED"); const leave = await leaves.update({ _id: (request.params as { id: string }).id }, { $set: { status: parsed.data.status } }, { returnUpdatedDocs: true }); if (!leave) return reply.notFound("Leave request not found"); await audit(request.user.id, parsed.data.status, "LeaveRequest", leave._id); return clean(leave); });
app.get("/api/payroll", { preHandler: auth }, async (request) => { const filter = request.user.role === "EMPLOYEE" ? { employeeId: request.user.employeeId } : {}; const result = await payroll.find(filter).sort({ period: -1 }); for (const item of result) { item.employee = await findEmployee(item.employeeId); if (item.employee) item.employee.user = await userForEmployee(item.employee); } return result.map(clean); });
app.post("/api/payroll/process", { preHandler: roles("ADMIN", "HR") }, async (request, reply) => { const parsed = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) }).safeParse(request.body); if (!parsed.success) return reply.badRequest("Period must use YYYY-MM format"); const active = await employees.find({ employmentStatus: "ACTIVE" }); for (const employee of active) { const gross = employee.baseSalary / 12; const record = { employeeId: employee._id, period: parsed.data.period, grossSalary: gross, tax: gross * .18, deductions: gross * .05, netSalary: gross * .77, status: "PROCESSED", createdAt: new Date().toISOString() }; await payroll.update({ employeeId: employee._id, period: parsed.data.period }, { $set: record }, { upsert: true }); } await audit(request.user.id, "PROCESS", "Payroll", parsed.data.period, { records: active.length }); return { processed: active.length, period: parsed.data.period }; });
app.get("/api/audit", { preHandler: roles("ADMIN") }, async () => { const result = await audits.find({}).sort({ createdAt: -1 }).limit(100); for (const item of result) item.user = await findUser(item.userId); return result.map(clean); });
app.setErrorHandler((error, _request, reply) => { app.log.error(error); if ((error as { errorType?: string }).errorType === "uniqueViolated") return reply.conflict("A record with this value already exists"); return reply.internalServerError("An unexpected server error occurred"); });
await initializeDatabase(); const port = Number(process.env.PORT ?? 4000); app.listen({ port, host: "0.0.0.0" }).catch(error => { app.log.error(error); process.exit(1); });
