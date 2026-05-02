import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

type BackendCategory = {
  _id: string;
  parentId?: string | null;
  properties?: BackendCategoryProperty[];
};

type BackendCategoryProperty = {
  name?: string;
  values?: string[];
};

function normalizeCategoryProperties(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const name = typeof item.name === "string" ? item.name.trim() : "";
      const values = Array.isArray(item.values)
        ? item.values
            .map((entry: unknown) => (typeof entry === "string" ? entry.trim() : ""))
            .filter(Boolean)
        : [];

      if (!name) return null;

      return {
        name,
        values: [...new Set(values)],
      };
    })
    .filter(Boolean);
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload === "object" && payload !== null) {
    if ("error" in payload && typeof payload.error === "string") return payload.error;
    if ("message" in payload && typeof payload.message === "string") return payload.message;
  }
  return fallback;
}

function normalizeAdminCategoryShape(categories: BackendCategory[]) {
  const byId = new Map(categories.map((category) => [String(category._id), category]));

  return categories.map((category) => ({
    ...category,
    parent: category.parentId ? byId.get(String(category.parentId)) || null : null,
    parentCategory: category.parentId || "",
    properties: Array.isArray(category.properties) ? category.properties : [],
  }));
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  await isAdminRequest(req, res);

  const backendUrl = process.env.AUCTION_BACKEND_URL;
  const backendToken = process.env.AUCTION_ADMIN_TOKEN;

  if (!backendUrl || !backendToken) {
    return res.status(500).json({
      error: "Missing AUCTION_BACKEND_URL or AUCTION_ADMIN_TOKEN in admin environment.",
    });
  }

  const targetBaseUrl = `${backendUrl.replace(/\/$/, "")}/api/v1/categories`;

  try {
    if (req.method === "GET") {
      const response = await fetch(targetBaseUrl, {
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      });

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(payload, "Failed to load categories."),
        });
      }

      const categories = Array.isArray(payload) ? (payload as BackendCategory[]) : [];
      return res.status(200).json(normalizeAdminCategoryShape(categories));
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as Record<string, unknown>;
      const backendPayload = {
        name: body.name,
        slug: body.slug,
        parentId: body.parentCategory || null,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
        properties: normalizeCategoryProperties(body.properties),
      };

      const response = await fetch(targetBaseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      });

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(payload, "Failed to create category."),
        });
      }

      return res.status(response.status).json(payload);
    }

    if (req.method === "PUT") {
      const body = (req.body || {}) as Record<string, unknown>;
      if (!body._id) {
        return res.status(400).json({ error: "Category id is required." });
      }

      const backendPayload = {
        name: body.name,
        slug: body.slug,
        parentId: body.parentCategory || null,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
        properties: normalizeCategoryProperties(body.properties),
      };

      const response = await fetch(`${targetBaseUrl}/${body._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      });

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(payload, "Failed to update category."),
        });
      }

      return res.status(response.status).json(payload);
    }

    if (req.method === "DELETE") {
      const id = req.query._id;
      if (!id) {
        return res.status(400).json({ error: "Category id is required." });
      }

      const response = await fetch(`${targetBaseUrl}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      });

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(payload, "Failed to delete category."),
        });
      }

      return res.status(response.status).json(payload);
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to backend categories endpoint.",
    });
  }
}
