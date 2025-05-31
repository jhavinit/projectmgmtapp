/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const taskRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.db.task.findMany({
        where: {
          projectId: input.projectId,
          OR: [{ assignedToId: userId }, { createdById: userId }],
        },
        include: {
          assignedTo: true,
          createdBy: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        deadline: z.date(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
        tags: z.array(z.string()),
        projectId: z.string(),
        assignedToId: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          deadline: input.deadline,
          priority: input.priority,
          tags: input.tags,
          projectId: input.projectId,
          assignedToId: input.assignedToId,
          createdById: ctx.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
        deadline: z.date(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
        tags: z.array(z.string()),
        assignedToId: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          deadline: input.deadline,
          priority: input.priority,
          tags: input.tags,
          assignedToId: input.assignedToId,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.task.delete({ where: { id: input.id } });
    }),
});
