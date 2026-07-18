import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";
import clientPromise from "@/lib/mongodb";
import { AUDIT_COLLECTION } from "@/lib/audit";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // The activity history is admin-only — employees never see it.
  if (!(await isAdminRequest(req, res))) return;

  const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 150));
  const resource =
    typeof req.query.resource === "string" && req.query.resource
      ? req.query.resource
      : undefined;

  try {
    const client = await clientPromise;
    const entries = await client
      .db()
      .collection(AUDIT_COLLECTION)
      .find(resource ? { resource } : {})
      .sort({ at: -1 })
      .limit(limit)
      .toArray();

    return res.status(200).json(
      entries.map((entry) => ({
        ...entry,
        _id: String(entry._id),
        at:
          entry.at instanceof Date
            ? entry.at.toISOString()
            : entry.at,
      }))
    );
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to load activity log.",
    });
  }
}
