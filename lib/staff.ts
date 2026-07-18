import clientPromise from "@/lib/mongodb";
import type { Role } from "@/lib/adminAccess";

export const STAFF_COLLECTION = "staffMembers";

export type StaffMember = {
  email: string;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
};

const normalizeEmail = (email?: string | null) =>
  String(email || "").trim().toLowerCase();

async function staffCollection() {
  const client = await clientPromise;
  return client.db().collection<StaffMember>(STAFF_COLLECTION);
}

export async function getStaffRole(email?: string | null): Promise<Role | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const collection = await staffCollection();
  const doc = await collection.findOne({ email: normalized });
  return doc?.role ?? null;
}

export async function listStaff(): Promise<StaffMember[]> {
  const collection = await staffCollection();
  const docs = await collection.find({}).sort({ email: 1 }).toArray();
  return docs.map((doc) => ({
    email: doc.email,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy,
  }));
}

export async function upsertStaff(
  email: string,
  role: Role,
  actorEmail: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  const collection = await staffCollection();
  const now = new Date();
  await collection.updateOne(
    { email: normalized },
    {
      $set: { email: normalized, role, updatedAt: now },
      $setOnInsert: { createdAt: now, createdBy: normalizeEmail(actorEmail) },
    },
    { upsert: true }
  );
}

export async function removeStaff(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const collection = await staffCollection();
  const result = await collection.deleteOne({ email: normalized });
  return result.deletedCount > 0;
}
