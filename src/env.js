import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Enum for supported Node environments.
 * @readonly
 * @enum {string}
 */
export const NodeEnv = {
  DEVELOPMENT: "development",
  TEST: "test",
  PRODUCTION: "production",
};

/**
 * Production-grade environment variable validation and access.
 * Uses zod for schema validation and @t3-oss/env-nextjs for integration with Next.js.
 */
export const env = createEnv({
  /**
   * Server-side environment variables schema.
   * Ensures the app isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    HUGGING_FACE_API_KEY: z.string(),
    NODE_ENV: z
      .enum([NodeEnv.DEVELOPMENT, NodeEnv.TEST, NodeEnv.PRODUCTION])
      .default(NodeEnv.DEVELOPMENT),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === NodeEnv.PRODUCTION
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // Use VERCEL_URL if NEXTAUTH_URL is not set (for Vercel deployments)
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it can't be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url(),
    ),
    HUGGING_FACE_API_URL: z
      .string()
      .url()
      .default(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      ),
    // DISCORD_CLIENT_ID: z.string(),
    // DISCORD_CLIENT_SECRET: z.string(),
  },

  /**
   * Client-side environment variables schema.
   * To expose them to the client, prefix with `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * Runtime environment variable mapping.
   * Destruct manually due to Next.js edge runtime/client-side restrictions.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    HUGGING_FACE_API_URL: process.env.HUGGING_FACE_API_URL,
    // DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    // DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
