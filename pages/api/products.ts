import type { NextApiRequest, NextApiResponse } from "next";
import { Product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
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

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await mongooseConnect();
  await isAdminRequest(req, res);

  if (method === "GET") {
    if (req.query?.id) {
      return res.json(await Product.findOne({ _id: req.query.id }));
    }

    return res.json(await Product.find());
  }

  if (method === "POST") {
    try {
      const payload = normalizePayload((req.body || {}) as Record<string, unknown>);
      const product = await Product.create(payload);
      return res.json(product);
    } catch (error) {
      return res
        .status(400)
        .json({ error: error instanceof Error ? error.message : "Failed to create product" });
    }
  }

  if (method === "PUT") {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const { _id } = body;
      const payload = normalizePayload(body);
      await Product.updateOne({ _id }, payload);
      return res.json(true);
    } catch (error) {
      return res
        .status(400)
        .json({ error: error instanceof Error ? error.message : "Failed to update product" });
    }
  }

  if (method === "DELETE") {
    if (req.query?.id) {
      await Product.deleteOne({ _id: req.query.id });
      return res.json(true);
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
