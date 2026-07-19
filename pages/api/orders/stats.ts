import type { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/lib/authz";

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await authorize(req, res);
  if (!actor) return;

  const backendUrl = process.env.AUCTION_BACKEND_URL;
  const backendToken = process.env.AUCTION_ADMIN_TOKEN;
  if (!backendUrl || !backendToken) {
    return res.status(500).json({
      error: "Missing AUCTION_BACKEND_URL or AUCTION_ADMIN_TOKEN in admin environment.",
    });
  }

  const targetUrl = `${backendUrl.replace(/\/$/, "")}/api/v1/orders/stats`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${backendToken}` },
    });

    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      return res.status(response.status).json({
        error: getErrorMessage(payload, "Failed to load order stats from backend."),
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to backend order stats endpoint.",
    });
  }
}
