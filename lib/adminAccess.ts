const DEFAULT_ADMIN_EMAILS = [
  "larkfreeme70.55@gmail.com",
  "krzysztoffaracik@gmail.com",
];

const parseAdminEmails = () => {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return fromEnv.length > 0 ? fromEnv : DEFAULT_ADMIN_EMAILS;
};

export const adminEmails = parseAdminEmails();

export const isAdminEmail = (email?: string | null) =>
  Boolean(email && adminEmails.includes(email.toLowerCase()));
