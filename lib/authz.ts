import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { resolveUserRole, type Role } from "@/lib/adminAccess";
import { isWriteMethod, recordDenied } from "@/lib/audit";

export type Actor = { email: string; role: Role };

// Authorize an admin API request and return the acting user.
// - No valid role -> 401 (and null).
// - Employee attempting a write (POST/PUT/PATCH/DELETE) -> 403 (and null),
//   recorded in the audit log so the attempt is never silent.
// On success the caller should invoke auditOnFinish(req, res, actor).
export async function authorize(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Actor | null> {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email?.toLowerCase();
  const role = await resolveUserRole(email);

  if (!email || !role) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (isWriteMethod(req.method) && role !== "admin") {
    await recordDenied(req, { email, role }, 403);
    res.status(403).json({
      error:
        "Brak uprawnień. Konto pracownika ma dostęp tylko do wglądu i nie może modyfikować danych.",
    });
    return null;
  }

  return { email, role };
}

// Admin-only gate for every method (e.g. team management, activity history).
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Actor | null> {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email?.toLowerCase();
  const role = await resolveUserRole(email);

  if (!email || !role) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (role !== "admin") {
    res.status(403).json({ error: "Tylko administrator ma dostęp do tej sekcji." });
    return null;
  }

  return { email, role };
}
