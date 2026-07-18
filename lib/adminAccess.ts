import { getStaffRole } from "@/lib/staff";

export type Role = "admin" | "employee";

const parseEmails = (value: string | undefined) =>
  (value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const parseAdminEmails = () => {
  const fromEnv = parseEmails(process.env.ADMIN_EMAILS);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required ADMIN_EMAILS environment variable.");
  }

  return [];
};

// Bootstrap owners from env. These are always admins and cannot be removed from
// the team UI — they exist so the organisation can never lock itself out.
export const adminEmails = parseAdminEmails();

// Bootstrap read-only staff from env (optional). Excludes bootstrap admins.
export const employeeEmails = parseEmails(process.env.EMPLOYEE_EMAILS).filter(
  (email) => !adminEmails.includes(email)
);

export const isBootstrapAdmin = (email?: string | null) =>
  Boolean(email && adminEmails.includes(email.toLowerCase()));

export const isBootstrapEmployee = (email?: string | null) =>
  Boolean(email && employeeEmails.includes(email.toLowerCase()));

export const isBootstrapEmail = (email?: string | null) =>
  isBootstrapAdmin(email) || isBootstrapEmployee(email);

// Resolve a user's effective role. Precedence:
//   env bootstrap admin  >  DB staff member  >  env bootstrap employee  >  none
export const resolveUserRole = async (
  email?: string | null
): Promise<Role | null> => {
  if (!email) return null;
  const normalized = email.toLowerCase();

  if (isBootstrapAdmin(normalized)) return "admin";

  const dbRole = await getStaffRole(normalized);
  if (dbRole) return dbRole;

  if (isBootstrapEmployee(normalized)) return "employee";

  return null;
};

export const isAllowedEmail = async (email?: string | null) =>
  (await resolveUserRole(email)) !== null;
