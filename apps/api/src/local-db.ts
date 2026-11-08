import Datastore from "nedb-promises";
import bcrypt from "bcryptjs";
import path from "node:path";

type Doc = Record<string, any>;
const dir = path.resolve(process.cwd(), "data");
export const users: any = Datastore.create({ filename: path.join(dir, "users.db"), autoload: true });
export const employees: any = Datastore.create({ filename: path.join(dir, "employees.db"), autoload: true });
export const leaves: any = Datastore.create({ filename: path.join(dir, "leaves.db"), autoload: true });
export const payroll: any = Datastore.create({ filename: path.join(dir, "payroll.db"), autoload: true });
export const audits: any = Datastore.create({ filename: path.join(dir, "audits.db"), autoload: true });

export async function initializeDatabase() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const seed = [
    { email: "admin@acme-payroll.com", name: "Ava Morgan", role: "ADMIN" },
    { email: "hr@acme-payroll.com", name: "Noah Williams", role: "HR" },
    { email: "employee@acme-payroll.com", name: "Mia Chen", role: "EMPLOYEE" }
  ];
  for (const item of seed) {
    let user = await users.findOne({ email: item.email });
    if (!user) user = await users.insert({ ...item, passwordHash, createdAt: new Date().toISOString() });
    if (!await employees.findOne({ userId: user._id })) await employees.insert({
      userId: user._id, employeeNumber: item.role === "EMPLOYEE" ? "EMP-1001" : `STAFF-${user._id.slice(-4)}`,
      department: item.role === "EMPLOYEE" ? "Engineering" : "People Operations",
      designation: item.role === "EMPLOYEE" ? "Senior Software Engineer" : item.role,
      dateOfJoining: "2022-04-11", employmentStatus: "ACTIVE", baseSalary: item.role === "EMPLOYEE" ? 92000 : 78000,
      bankAccountLast4: "4821", phone: "+1 (555) 010-2040", address: "100 Market Street, San Francisco, CA", createdAt: new Date().toISOString()
    });
  }
}
export const clean = (doc: Doc | null) => { if (!doc) return null; const { _id, ...rest } = doc; return { ...rest, id: _id }; };
export const findUser = async (id: string) => users.findOne({ _id: id });
export const findEmployee = async (id: string) => employees.findOne({ _id: id });
export const userForEmployee = async (employee: Doc) => clean(await findUser(employee.userId));
