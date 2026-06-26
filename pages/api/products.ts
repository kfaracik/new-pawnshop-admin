import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

type ProductPayload = {
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: string;
  properties?: Record<string, string>;
  quantity?: number;
  availabilityMode?: string;
  availableLocations?: string[];
};

type BackendProduct = Omit<ProductPayload, "category"> & {
  _id?: string;
  category?: string | { _id?: string };
  availableLocationDetails?: Array<{ _id?: string }>;
};

function normalizePayload(body: Record<string, unknown>): ProductPayload {
  const {
    title,
    description,
    price,
    images,
    category,
    properties,
    quantity,
    availabilityMode,
    availableLocations,
  } = body;

  return {
    title: typeof title === "string" ? title : undefined,
    description: typeof description === "string" ? description : undefined,
    price:
      price === "" || price === null || price === undefined ? undefined : Number(price),
    images: Array.isArray(images) ? images.map(String) : undefined,
    category: typeof category === "string" && category ? category : undefined,
    properties:
      properties && typeof properties === "object"
        ? (properties as Record<string, string>)
        : undefined,
    quantity:
      quantity === "" || quantity === null || quantity === undefined
        ? undefined
        : Number(quantity),
    availabilityMode:
      typeof availabilityMode === "string" ? availabilityMode : undefined,
    availableLocations: Array.isArray(availableLocations)
      ? availableLocations.map(String).map((item) => item.trim()).filter(Boolean)
      : undefined,
  };
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

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch (_error) {
    return text;
  }
}

function normalizeAdminProductShape(product: unknown) {
  if (!product || typeof product !== "object") return product;

  const backendProduct = product as BackendProduct;
  const category =
    backendProduct.category && typeof backendProduct.category === "object"
      ? backendProduct.category._id || ""
      : backendProduct.category;
  const availableLocations = Array.isArray(backendProduct.availableLocationDetails)
    ? backendProduct.availableLocationDetails
        .map((location) => location?._id)
        .filter((id): id is string => Boolean(id))
    : backendProduct.availableLocations;

  return {
    ...backendProduct,
    category,
    availableLocations,
  };
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await isAdminRequest(req, res);

  const backendUrl = process.env.AUCTION_BACKEND_URL;
  const backendToken = process.env.AUCTION_ADMIN_TOKEN;

  if (!backendUrl || !backendToken) {
    return res.status(500).json({
      error: "Missing AUCTION_BACKEND_URL or AUCTION_ADMIN_TOKEN in admin environment.",
    });
  }

  const targetBaseUrl = `${backendUrl.replace(/\/$/, "")}/api/v1/products`;

  try {
    if (method === "GET") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      const listQuery = new URLSearchParams();
      if (!id) {
        listQuery.set("page", "1");
        listQuery.set("limit", "500");
      }

      const targetUrl = id
        ? `${targetBaseUrl}/${encodeURIComponent(id)}`
        : `${targetBaseUrl}?${listQuery.toString()}`;
      const response = await fetch(targetUrl, {
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      });
      const payload = await readJson(response);

      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(payload, "Failed to load products from backend."),
        });
      }

      if (!id && payload && typeof payload === "object" && "products" in payload) {
        const products = (payload as { products?: unknown }).products;
        return res
          .status(200)
          .json(Array.isArray(products) ? products.map(normalizeAdminProductShape) : []);
      }

      return res.status(200).json(normalizeAdminProductShape(payload));
    }

    if (method === "POST") {
      const payload = normalizePayload((req.body || {}) as Record<string, unknown>);
      const response = await fetch(targetBaseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const backendPayload = await readJson(response);

      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(backendPayload, "Failed to create product."),
        });
      }

      return res.status(response.status).json(backendPayload);
    }

    if (method === "PUT") {
      const body = (req.body || {}) as Record<string, unknown>;
      const id = typeof body._id === "string" ? body._id : "";

      if (!id) {
        return res.status(400).json({ error: "Product id is required." });
      }

      const payload = normalizePayload(body);
      const response = await fetch(`${targetBaseUrl}/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const backendPayload = await readJson(response);

      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(backendPayload, "Failed to update product."),
        });
      }

      return res.status(response.status).json(backendPayload);
    }

    if (method === "DELETE") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      if (!id) {
        return res.status(400).json({ error: "Product id is required." });
      }

      const response = await fetch(`${targetBaseUrl}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      });
      const payload = await readJson(response);

      if (!response.ok) {
        return res.status(response.status).json({
          error: getErrorMessage(payload, "Failed to delete product."),
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
          : "Failed to connect to backend products endpoint.",
    });
  }
}
