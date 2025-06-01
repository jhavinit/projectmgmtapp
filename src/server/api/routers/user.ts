import { z } from "zod";
import { compare, hash } from "bcryptjs";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { handleApiError } from "../error-handler";

/**
 * userRouter defines all user-related API endpoints.
 * Uses centralized error handling for consistency and maintainability.
 */
export const userRouter = createTRPCRouter({
  /**
   * getAll - Returns all users in the system.
   * Protected: Only accessible to authenticated users.
   */
  getAll: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      return ctx.db.user.findMany();
    })
  ),

  /**
   * register - Registers a new user.
   * Public: Accessible without authentication.
   * Validates input, checks for existing user, hashes password, and creates user.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Check if user already exists
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (existingUser) {
          throw new Error("User already exists");
        }

        // Hash the password before saving
        const hashedPassword = await hash(input.password, 10);

        // Create the new user
        await ctx.db.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: hashedPassword,
          },
        });

        return { success: true };
      })
    ),

  /**
   * changePassword - Changes the user's password.
   * Protected: Only accessible to authenticated users.
   * Validates old password, hashes new password, and updates the user's password.
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string().min(6),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) =>
      handleApiError(async () => {
        const userId = ctx.session.user.id;
        const user = await ctx.db.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        const isMatch = await compare(input.oldPassword, user.password);
        if (!isMatch) throw new Error("Old password is incorrect");

        const hashed = await hash(input.newPassword, 10);
        await ctx.db.user.update({
          where: { id: userId },
          data: { password: hashed },
        });
        return { success: true };
      })
    ),
});