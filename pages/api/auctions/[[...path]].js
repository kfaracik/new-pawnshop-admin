import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.message === "string") return payload.message;
  return fallback;
}

export default async function handler(req, res) {
  await isAdminRequest(req, res);

  const backendUrl = process.env.AUCTION_BACKEND_URL;
  const backendToken = process.env.AUCTION_ADMIN_TOKEN;
  if (!backendUrl || !backendToken) {
    return res.status(500).json({
      error:
        "Missing AUCTION_BACKEND_URL or AUCTION_ADMIN_TOKEN in admin environment.",
    });
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [];
  const searchParams = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === "path") return;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const targetUrl = `${backendUrl.replace(/\/$/, "")}/api/v1/auctions/${pathParts.join("/")}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${backendToken}`,
        "Content-Type": "application/json",
      },
      body:
        req.method === "GET" || req.method === "DELETE"
          ? undefined
          : JSON.stringify(req.body || {}),
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: getErrorMessage(payload, "Auction backend request failed.") });
    }

    if (isJson) {
      return res.status(response.status).json(payload);
    }
    return res.status(response.status).send(payload);
  } catch (error) {
    return res.status(502).json({
      error: error?.message || "Failed to connect to auction backend.",
    });
  }
}

