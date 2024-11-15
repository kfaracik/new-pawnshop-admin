import { Product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  const { method } = req;
  await mongooseConnect();
  await isAdminRequest(req, res);

  if (method === "GET") {
    if (req.query?.id) {
      res.json(await Product.findOne({ _id: req.query.id }));
    } else {
      res.json(await Product.find());
    }
  }

  if (method === "POST") {
    const {
      title,
      description,
      price,
      images,
      category,
      properties,
      isAuction,
      auctionLink,
    } = req.body;
    const product = await Product.create({
      title,
      description,
      price,
      images,
      category,
      properties,
      isAuction,
      auctionLink,
    });
    res.json(product);
  }

  if (method === "PUT") {
    const {
      _id,
      title,
      description,
      price,
      images,
      category,
      properties,
      isAuction,
      auctionLink,
    } = req.body;
    await Product.updateOne(
      { _id },
      {
        title,
        description,
        price,
        images,
        category,
        properties,
        isAuction,
        auctionLink,
      }
    );
    res.json(true);
  }

  if (method === "DELETE") {
    if (req.query?.id) {
      await Product.deleteOne({ _id: req.query?.id });
      res.json(true);
    }
  }
}
