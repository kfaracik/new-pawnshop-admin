import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { adminEmails, isAdminEmail } from "@/lib/adminAccess";
import clientPromise from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  secret: process.env.SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    signIn: ({ user }) => {
      return isAdminEmail(user.email);
    },
  },
};

export default NextAuth(authOptions);

export async function isAdminRequest(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email || !adminEmails.includes(email)) {
    res.status(401).json({ error: "Unauthorized" });
    throw new Error("not an admin");
  }
}
