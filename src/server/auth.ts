import { PrismaAdapter } from "@auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type Session,
  type User,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { env } from "~/env";
import { db } from "~/server/db";

// TODO: Move UserRole and other enums/interfaces to a shared types/enums file if needed

/**
 * Module augmentation for `next-auth` types.
 * Allows us to add custom properties to the `session` object and keep type safety.
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      // role?: UserRole; // Uncomment and use if you add roles
    };
  }
  // interface User {
  //   id: string;
  //   // role?: UserRole;
  // }
}

/**
 * NextAuth.js configuration options.
 * Includes session/jwt callbacks, Prisma adapter, and authentication providers.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Adds user ID to the session object.
     * @param session - The current session object.
     * @param token - The JWT token.
     * @returns The updated session object.
     */
    async session({ session, token }): Promise<Session> {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      // TODO: Add user role or other custom claims if needed
      return session;
    },
    /**
     * Adds user ID to the JWT token.
     * @param token - The current JWT token.
     * @param user - The authenticated user.
     * @returns The updated token.
     */
    async jwt({ token, user }): Promise<typeof token> {
      if (user) {
        token.id = user.id;
        // TODO: Add user role or other custom claims if needed
      }
      return token;
    },
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    // Add OAuth providers here (e.g., Discord, GitHub, Google) as needed.
    // Example for Discord (uncomment and configure env vars):
    // DiscordProvider({
    //   clientId: env.DISCORD_CLIENT_ID,
    //   clientSecret: env.DISCORD_CLIENT_SECRET,
    // }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password", placeholder: "••••••••" },
      },
      /**
       * Authorize user with email and password.
       * @param credentials - The credentials object containing email and password.
       * @returns The authenticated user or null.
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return user;
      },
    }),
  ],
  // TODO: Add custom pages (signIn, error, etc.) if needed for better UX
};

/**
 * Helper function to get the server-side authentication session.
 * Use this instead of importing authOptions everywhere.
 * @param ctx - The Next.js server-side context.
 * @returns The server session.
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};

