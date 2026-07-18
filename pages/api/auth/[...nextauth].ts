import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, {
  getServerSession,
  type NextAuthOptions,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { adminEmails, isAdminEmail } from "@/lib/adminAccess";
import clientPromise from "@/lib/mongodb";

const isProduction = process.env.NODE_ENV === "production";
const devPassword = process.env.DEV_ADMIN_PASSWORD;
// Dev credentials login is opt-in (explicit flag) and never active in production.
const devLoginEnabled =
  !isProduction &&
  process.env.ENABLE_DEV_LOGIN === "true" &&
  Boolean(devPassword);

const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_ID || "",
    clientSecret: process.env.GOOGLE_SECRET || "",
    authorization: {
      params: {
        prompt: "select_account",
      },
    },
  }),
];

if (devLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: "dev-login",
      name: "Local admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) => {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password || "";

        if (!email || !isAdminEmail(email) || password !== devPassword) {
          return null;
        }

        return { id: email, email, name: email.split("@")[0] };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.SECRET,
  providers,
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: isProduction ? "database" : "jwt" },
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
