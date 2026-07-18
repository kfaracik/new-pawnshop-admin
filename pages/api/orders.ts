import type { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/lib/authz";
import { auditOnFinish } from "@/lib/audit";

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object" && payload !== null) {
    if ("error" in payload && typeof payload.error === "string") return payload.error;
    if ("message" in payload && typeof payload.message === "string") return payload.message;
  }
  return fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!["GET", "PUT", "PATCH"].includes(req.method || "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await authorize(req, res);
  if (!actor) return;
  auditOnFinish(req, res, actor);

  const backendUrl = process.env.AUCTION_BACKEND_URL;
  const backendToken = process.env.AUCTION_ADMIN_TOKEN;
  if (!backendUrl || !backendToken) {
    return res.status(500).json({
      error: "Missing AUCTION_BACKEND_URL or AUCTION_ADMIN_TOKEN in admin environment.",
    });
  }

  const ALLOWED_QUERY_KEYS = new Set([
    "page",
    "limit",
    "status",
    "orderStatus",
    "paymentStatus",
    "sort",
    "search",
  ]);
  const query = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (!ALLOWED_QUERY_KEYS.has(key)) return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
    } else if (value !== undefined) {
      query.append(key, String(value));
    }
  });

  const orderId = typeof req.query.id === "string" ? req.query.id : "";
  const targetUrl = `${backendUrl.replace(/\/$/, "")}/api/v1/orders${orderId ? `/${encodeURIComponent(orderId)}` : ""}${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method === "GET" ? "GET" : "PUT",
      headers: {
        Authorization: `Bearer ${backendToken}`,
        ...(req.method === "GET" ? {} : { "Content-Type": "application/json" }),
      },
      body: req.method === "GET" ? undefined : JSON.stringify(req.body || {}),
    });

    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      return res.status(response.status).json({
        error: getErrorMessage(payload, "Failed to load orders from backend."),
      });
    }

    if (req.method === "GET") {
      return res.status(200).json(Array.isArray(payload) ? payload : []);
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to backend orders endpoint.",
    });
  }
}
