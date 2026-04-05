import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.message === "string") return payload.message;
  return fallback;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await isAdminRequest(req, res);

  const backendUrl = process.env.AUCTION_BACKEND_URL;
  const backendToken = process.env.AUCTION_ADMIN_TOKEN;
  if (!backendUrl || !backendToken) {
    return res.status(500).json({
      error:
        "Missing AUCTION_BACKEND_URL or AUCTION_ADMIN_TOKEN in admin environment.",
    });
  }

  const query = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
    } else if (value !== undefined) {
      query.append(key, String(value));
    }
  });

  const targetUrl = `${backendUrl.replace(/\/$/, "")}/api/v1/orders${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${backendToken}`,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: getErrorMessage(payload, "Failed to load orders from backend."),
      });
    }

    return res.status(200).json(Array.isArray(payload) ? payload : []);
  } catch (error) {
    return res.status(502).json({
      error: error?.message || "Failed to connect to backend orders endpoint.",
    });
  }
}
