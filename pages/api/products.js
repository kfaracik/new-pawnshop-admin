import { Product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  const { method } = req;
  await mongooseConnect();
  await isAdminRequest(req, res);

  function normalizePayload(body) {
    const {
      title,
      description,
      price,
      images,
      category,
      properties,
      isAuction,
      auctionLink,
      quantity,
    } = body;

    return {
      title,
      description,
      price: price === "" || price === null || price === undefined ? undefined : Number(price),
      images,
      category: category ? category : undefined,
      properties,
      isAuction: Boolean(isAuction),
      auctionLink: isAuction ? auctionLink : null,
      quantity:
        quantity === "" || quantity === null || quantity === undefined
          ? undefined
          : Number(quantity),
    };
  }

  if (method === "GET") {
    if (req.query?.id) {
      res.json(await Product.findOne({ _id: req.query.id }));
    } else {
      res.json(await Product.find());
    }
  }

  if (method === "POST") {
    try {
      const payload = normalizePayload(req.body);
      const product = await Product.create(payload);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to create product" });
    }
  }

  if (method === "PUT") {
    try {
      const { _id } = req.body;
      const payload = normalizePayload(req.body);
      await Product.updateOne({ _id }, payload);
      res.json(true);
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to update product" });
    }
  }

  if (method === "DELETE") {
    if (req.query?.id) {
      await Product.deleteOne({ _id: req.query?.id });
      res.json(true);
    }
  }
}
