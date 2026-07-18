import { mongooseConnect } from "@/lib/mongoose";
import { Location } from "@/models/Location";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

const normalizePayload = (body = {}) => ({
  name: typeof body.name === "string" ? body.name.trim() : "",
  city: typeof body.city === "string" ? body.city.trim() : "",
  addressLine1: typeof body.addressLine1 === "string" ? body.addressLine1.trim() : "",
  addressLine2: typeof body.addressLine2 === "string" ? body.addressLine2.trim() : "",
  postalCode: typeof body.postalCode === "string" ? body.postalCode.trim() : "",
  phone: typeof body.phone === "string" ? body.phone.trim() : "",
  email: typeof body.email === "string" ? body.email.trim() : "",
  description: typeof body.description === "string" ? body.description.trim() : "",
  isActive: typeof body.isActive === "boolean" ? body.isActive : true,
  sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
});

const toObjectId = (value) => {
  const id = String(Array.isArray(value) ? value[0] : value || "");
  return /^[a-f\d]{24}$/i.test(id) ? id : null;
};

export default async function handle(req, res) {
  await mongooseConnect();
  await isAdminRequest(req, res);

  if (req.method === "GET") {
    if (req.query?.id) {
      const id = toObjectId(req.query.id);
      if (!id) {
        return res.status(400).json({ error: "Invalid location id." });
      }
      return res.json(await Location.findOne({ _id: id }));
    }

    return res.json(await Location.find().sort({ sortOrder: 1, name: 1 }));
  }

  if (req.method === "POST") {
    try {
      const payload = normalizePayload(req.body || {});
      if (!payload.name) {
        return res.status(400).json({ error: "Location name is required." });
      }
      const location = await Location.create(payload);
      return res.json(location);
    } catch (error) {
      return res.status(400).json({ error: error?.message || "Failed to create location." });
    }
  }

  if (req.method === "PUT") {
    try {
      const id = toObjectId((req.body || {})._id);
      const payload = normalizePayload(req.body || {});
      if (!id) {
        return res.status(400).json({ error: "Invalid location id." });
      }
      await Location.updateOne({ _id: id }, payload);
      return res.json(true);
    } catch (error) {
      return res.status(400).json({ error: error?.message || "Failed to update location." });
    }
  }

  if (req.method === "DELETE") {
    if (req.query?.id) {
      const id = toObjectId(req.query.id);
      if (!id) {
        return res.status(400).json({ error: "Invalid location id." });
      }
      await Location.deleteOne({ _id: id });
      return res.json(true);
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
