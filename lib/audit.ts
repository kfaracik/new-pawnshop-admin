import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export const AUDIT_COLLECTION = "adminAuditLog";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type AuditOutcome = "success" | "denied" | "error";

export type AuditEntry = {
  at: Date;
  actorEmail: string;
  actorRole: string;
  method: string;
  resource: string;
  action: string;
  targetId?: string;
  summary?: string;
  statusCode: number;
  outcome: AuditOutcome;
  ip?: string;
};

export function isWriteMethod(method?: string) {
  return WRITE_METHODS.has((method || "GET").toUpperCase());
}

export function resourceFromReq(req: NextApiRequest): string {
  const path = (req.url || "").split("?")[0];
  const segment = path.replace(/^\/api\//, "").split("/")[0];
  return segment || "unknown";
}

function verbFromMethod(method: string): string {
  const upper = method.toUpperCase();
  if (upper === "POST") return "create";
  if (upper === "DELETE") return "delete";
  return "update";
}

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || "";
}

function targetAndSummary(req: NextApiRequest): {
  targetId?: string;
  summary?: string;
} {
  const body = (req.body || {}) as Record<string, unknown>;
  const targetId =
    (typeof body._id === "string" && body._id) ||
    (typeof req.query.id === "string" && (req.query.id as string)) ||
    undefined;
  const summary =
    (typeof body.title === "string" && body.title) ||
    (typeof body.name === "string" && body.name) ||
    undefined;
  return { targetId, summary };
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const client = await clientPromise;
    await client.db().collection(AUDIT_COLLECTION).insertOne(entry);
  } catch (error) {
    // Never let audit logging break the request it is observing.
    console.error("[audit] failed to record entry", error);
  }
}

// Log an authorization denial immediately (the response is already sent, so the
// finish-hook below never fires for these).
export async function recordDenied(
  req: NextApiRequest,
  actor: { email: string; role: string },
  statusCode: number
): Promise<void> {
  const method = (req.method || "GET").toUpperCase();
  const resource = resourceFromReq(req);
  const { targetId, summary } = targetAndSummary(req);
  await recordAudit({
    at: new Date(),
    actorEmail: actor.email,
    actorRole: actor.role,
    method,
    resource,
    action: `${resource}.${verbFromMethod(method)}`,
    targetId,
    summary,
    statusCode,
    outcome: "denied",
    ip: clientIp(req),
  });
}

// Attach a finish-hook that records the outcome of a write request once the
// response status is known. Reads are not logged.
export function auditOnFinish(
  req: NextApiRequest,
  res: NextApiResponse,
  actor: { email: string; role: string }
): void {
  const method = (req.method || "GET").toUpperCase();
  if (!isWriteMethod(method)) return;

  const resource = resourceFromReq(req);
  const { targetId, summary } = targetAndSummary(req);
  const action = `${resource}.${verbFromMethod(method)}`;
  const ip = clientIp(req);

  res.on("finish", () => {
    const statusCode = res.statusCode;
    const outcome: AuditOutcome =
      statusCode >= 200 && statusCode < 300
        ? "success"
        : statusCode === 401 || statusCode === 403
          ? "denied"
          : "error";

    void recordAudit({
      at: new Date(),
      actorEmail: actor.email,
      actorRole: actor.role,
      method,
      resource,
      action,
      targetId,
      summary,
      statusCode,
      outcome,
      ip,
    });
  });
}
