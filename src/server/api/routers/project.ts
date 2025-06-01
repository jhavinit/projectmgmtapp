/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  // // Get all projects assigned to current user
  // getAll: protectedProcedure.query(async ({ ctx }) => {
  //   try {
  //     // find all assignments for current user and include project
  //     const assignments = await ctx.db.projectAssignment.findMany({
  //       where: { userId: ctx.session.user.id },
  //       include: { project: true },
  //       orderBy: {
  //         project: { createdAt: "asc" },
  //       },
  //     });

  //     // return array of projects from assignments
  //     return assignments.map((a) => a.project);
  //   } catch (error: unknown) {
  //     const errorMessage =
  //       error instanceof Error ? error.message : "Failed to fetch projects";
  //     throw new Error(errorMessage);
  //   }
  // }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const projects = await ctx.db.project.findMany({
      where: {
        projectAssignments: {
          some: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        projectAssignments: {
          select: { userId: true },
        },
      },
    });

    return projects;
  }),

  // Create project and assign current user
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        details: z.string().min(1),
        userIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // create project first
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          details: input.details,
        },
      });

      // create project assignment for current user
      // await ctx.db.projectAssignment.create({
      //   data: {
      //     projectId: project.id,
      //     userId: ctx.session.user.id,
      //     assignedAt: new Date(),
      //     role: "owner", // or whatever default role you want
      //   },
      // });

      // create project assignment for other users
      await ctx.db.projectAssignment.createMany({
        data: input.userIds.map((userId) => ({
          projectId: project.id,
          userId,
          assignedAt: new Date(),
          role: "member", // or whatever default role you want
        })),
      });

      return "Project created successfully";
    }),

  // Edit project
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        details: z.string().min(1),
        userIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // update project
      const project = await ctx.db.project.update({
        where: { id: input.id },
        data: {
          name: input.name,
          details: input.details,
        },
      });

      // delete project assignment for other users
      await ctx.db.projectAssignment.deleteMany({
        where: { projectId: input.id },
      });

      // create project assignment for other users
      await ctx.db.projectAssignment.createMany({
        data: input.userIds.map((userId) => ({
          projectId: input.id,
          userId,
          assignedAt: new Date(),
          role: "member", // or whatever default role you want
        })),
      });
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // delete project assignment for other users
      await ctx.db.projectAssignment.deleteMany({
        where: { projectId: input.id },
      });

      return ctx.db.project.delete({
        where: { id: input.id },
      });
    }),

  // Optional: assign another user to project
  addUser: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        role: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.projectAssignment.create({
        data: {
          projectId: input.projectId,
          userId: input.userId,
          assignedAt: new Date(),
          role: input.role ?? "member",
        },
      });
    }),

  // Optional: remove user from project
  removeUser: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.projectAssignment.deleteMany({
        where: {
          projectId: input.projectId,
          userId: input.userId,
        },
      });
    }),
});
