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

export const adminEmails = parseAdminEmails();

// Read-only staff. Excludes anyone already listed as a full admin so an email
// can never be both roles at once (admin always wins).
export const employeeEmails = parseEmails(process.env.EMPLOYEE_EMAILS).filter(
  (email) => !adminEmails.includes(email)
);

export const isAdminEmail = (email?: string | null) =>
  Boolean(email && adminEmails.includes(email.toLowerCase()));

export const isEmployeeEmail = (email?: string | null) =>
  Boolean(email && employeeEmails.includes(email.toLowerCase()));

// Anyone allowed to sign in at all (admin OR employee).
export const isAllowedEmail = (email?: string | null) =>
  isAdminEmail(email) || isEmployeeEmail(email);

export const getUserRole = (email?: string | null): Role | null => {
  if (isAdminEmail(email)) return "admin";
  if (isEmployeeEmail(email)) return "employee";
  return null;
};
