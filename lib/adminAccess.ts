const parseAdminEmails = () => {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required ADMIN_EMAILS environment variable.");
  }

  return [];
};

export const adminEmails = parseAdminEmails();

export const isAdminEmail = (email?: string | null) =>
  Boolean(email && adminEmails.includes(email.toLowerCase()));
