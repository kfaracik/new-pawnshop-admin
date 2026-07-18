import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/authz";
import { auditOnFinish } from "@/lib/audit";
import {
  adminEmails,
  employeeEmails,
  isBootstrapEmail,
  type Role,
} from "@/lib/adminAccess";
import { listStaff, removeStaff, upsertStaff } from "@/lib/staff";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: Role[] = ["admin", "employee"];

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  auditOnFinish(req, res, actor);

  try {
    if (req.method === "GET") {
      const dbMembers = await listStaff();
      const dbEmails = new Set(dbMembers.map((member) => member.email));

      // Bootstrap owners/staff from env come first and are not editable here.
      const bootstrap = [
        ...adminEmails.map((email) => ({ email, role: "admin" as Role })),
        ...employeeEmails.map((email) => ({ email, role: "employee" as Role })),
      ].filter((entry) => !dbEmails.has(entry.email));

      const members = [
        ...bootstrap.map((entry) => ({ ...entry, source: "config" as const })),
        ...dbMembers.map((member) => ({
          email: member.email,
          role: member.role,
          source: "db" as const,
          createdBy: member.createdBy,
          updatedAt: member.updatedAt,
        })),
      ];

      return res.status(200).json({ members, currentUser: actor.email });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const email = normalizeEmail(req.body?.email);
      const role = req.body?.role as Role;

      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "Podaj prawidłowy adres e-mail." });
      }
      if (!ROLES.includes(role)) {
        return res.status(400).json({ error: "Nieprawidłowa rola." });
      }
      if (isBootstrapEmail(email)) {
        return res.status(409).json({
          error:
            "To konto pochodzi z konfiguracji serwera (env) i nie można zmieniać go tutaj.",
        });
      }

      await upsertStaff(email, role, actor.email);
      return res.status(200).json({ email, role });
    }

    if (req.method === "DELETE") {
      const email = normalizeEmail(req.query.email);

      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "Podaj prawidłowy adres e-mail." });
      }
      if (email === actor.email) {
        return res
          .status(400)
          .json({ error: "Nie możesz usunąć własnego konta." });
      }
      if (isBootstrapEmail(email)) {
        return res.status(409).json({
          error: "To konto pochodzi z konfiguracji serwera (env) i nie można go tu usunąć.",
        });
      }

      const removed = await removeStaff(email);
      if (!removed) {
        return res.status(404).json({ error: "Nie znaleziono takiego konta." });
      }
      return res.status(200).json({ email });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Nie udało się przetworzyć żądania.",
    });
  }
}
