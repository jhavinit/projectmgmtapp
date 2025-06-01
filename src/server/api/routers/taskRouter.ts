/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const taskRouter = createTRPCRouter({
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.task.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),
  getAll: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        type: z
          .enum(["ALL", "BUG", "FEATURE", "IMPROVEMENT", "TASK"])
          .optional(),
        priority: z.enum(["ALL", "LOW", "MEDIUM", "HIGH"]).optional(),
        status: z.enum(["ALL", "TODO", "IN_PROGRESS", "DONE"]).optional(), // <-- add status
        skipPagination: z.boolean().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search } = input;

      // Build user filter
      const userFilter = [
        { assignedToId: ctx.session.user.id },
        { createdById: ctx.session.user.id },
      ];

      // Build search filter
      let searchFilter = {};
      if (search && search.trim() !== "") {
        searchFilter = {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        };
      }

      // Combine filters: projectId, type, priority, and user/search logic
      const where = {
        projectId: input.projectId,
        ...(input.type && input.type !== "ALL" ? { type: input.type } : {}),
        ...(input.priority && input.priority !== "ALL"
          ? { priority: input.priority }
          : {}),
        ...(input.status && input.status !== "ALL"
          ? { status: input.status }
          : {}),
        AND: [
          {
            OR: userFilter,
          },
          ...(search && search.trim() !== "" ? [searchFilter] : []),
        ],
      };

      console.log("where", where)

      // If skipPagination is true, return all tasks without pagination
      if (input.skipPagination) {
        const tasks = await ctx.db.task.findMany({
          where,
          include: {
            assignedTo: true,
            createdBy: true,
          },
          orderBy: { createdAt: "desc" },
        });
        return { tasks, totalPages: 1, currentPage: 1 };
      }

      const skip = (input.page - 1) * input.limit;
      const [tasks, totalCount] = await Promise.all([
        ctx.db.task.findMany({
          where,
          skip,
          take: input.limit,
          include: {
            assignedTo: true,
            createdBy: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.task.count({ where }),
      ]);

      return {
        tasks,
        totalPages: Math.ceil(totalCount / input.limit),
        currentPage: input.page,
      };
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
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
        type: z.enum(["BUG", "FEATURE", "IMPROVEMENT", "TASK"]),
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
          status: input.status,
          type: input.type,
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
        type: z.enum(["BUG", "FEATURE", "IMPROVEMENT", "TASK"]),
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
          type: input.type,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.task.delete({ where: { id: input.id } });
    }),
});
