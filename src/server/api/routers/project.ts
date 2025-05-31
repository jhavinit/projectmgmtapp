/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { Project } from "@prisma/client";

export const projectRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }): Promise<Project[]> => {
    try {
      return await ctx.db.project.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "asc" },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch projects";
      throw new Error(errorMessage);
    }
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), details: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.project.create({
        data: {
          name: input.name,
          details: input.details,
          userId: ctx.session.user.id,
        },
      });
      return "Project created successfully";
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        details: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.project.update({
        where: { id: input.id },
        data: {
          name: input.name,
          details: input.details,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.project.delete({
        where: { id: input.id },
      });
    }),
});
