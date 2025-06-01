import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { summarizeWithHuggingFace } from "~/server/utils/ai-summary-service";
import { handleApiError } from "../error-handler";
// TODO: Move role strings and assignment types to a shared enums/types file for consistency

/**
 * TRPC router for project-related operations.
 * Handles CRUD, user assignment, and AI-powered summary generation for projects.
 */
export const projectRouter = createTRPCRouter({
  /**
   * Get all projects assigned to the current user.
   * @returns Array of projects with assignment info.
   */
  getAll: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      const userId = ctx.session.user.id;

      const projects = await ctx.db.project.findMany({
        where: {
          projectAssignments: {
            some: { userId },
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          projectAssignments: { select: { userId: true } },
        },
      });

      return projects;
    })
  ),

  /**
   * Generate a summary for a project using Hugging Face AI.
   * @param summary - The text to summarize.
   * @returns The generated summary string.
   */
  generateSummary: protectedProcedure
    .input(z.object({ summary: z.string() }))
    .mutation(({ input }) =>
      handleApiError(async () => {
        const summary = await summarizeWithHuggingFace(input.summary);
        return summary;
      })
    ),

  /**
   * Create a new project and assign users.
   * @param name - Project name.
   * @param details - Project details.
   * @param summary - Optional summary.
   * @param userIds - Array of user IDs to assign.
   * @returns Success message.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        details: z.string().min(1),
        summary: z.string().optional(),
        userIds: z.array(z.string()),
      }),
    )
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Create the project
        const project = await ctx.db.project.create({
          data: {
            name: input.name,
            details: input.details,
            summary: input.summary ?? "",
          },
        });

        // Assign users to the project (default role: member)
        await ctx.db.projectAssignment.createMany({
          data: input.userIds.map((userId) => ({
            projectId: project.id,
            userId,
            assignedAt: new Date(),
            role: "member", // TODO: Use enum for roles
          })),
        });

        return "Project created successfully";
      })
    ),

  /**
   * Edit an existing project and update user assignments.
   * @param id - Project ID.
   * @param name - Project name.
   * @param details - Project details.
   * @param summary - Optional summary.
   * @param userIds - Array of user IDs to assign.
   */
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        details: z.string().min(1),
        summary: z.string().optional(),
        userIds: z.array(z.string()),
      }),
    )
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Update project details
        await ctx.db.project.update({
          where: { id: input.id },
          data: {
            name: input.name,
            details: input.details,
            summary: input.summary ?? "",
          },
        });

        // Remove all previous assignments for this project
        await ctx.db.projectAssignment.deleteMany({
          where: { projectId: input.id },
        });

        // Assign new users to the project
        await ctx.db.projectAssignment.createMany({
          data: input.userIds.map((userId) => ({
            projectId: input.id,
            userId,
            assignedAt: new Date(),
            role: "member", // TODO: Use enum for roles
          })),
        });
      })
    ),

  /**
   * Delete a project and its assignments.
   * @param id - Project ID.
   * @returns The deleted project.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Remove all assignments for this project
        await ctx.db.projectAssignment.deleteMany({
          where: { projectId: input.id },
        });

        // Delete the project itself
        return ctx.db.project.delete({
          where: { id: input.id },
        });
      })
    ),

  /**
   * Assign a user to a project.
   * @param projectId - Project ID.
   * @param userId - User ID.
   * @param role - Optional role (default: member).
   * @returns The created project assignment.
   */
  addUser: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        role: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        return ctx.db.projectAssignment.create({
          data: {
            projectId: input.projectId,
            userId: input.userId,
            assignedAt: new Date(),
            role: input.role ?? "member", // TODO: Use enum for roles
          },
        });
      })
    ),

  /**
   * Remove a user from a project.
   * @param projectId - Project ID.
   * @param userId - User ID.
   * @returns The result of the delete operation.
   */
  removeUser: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        return ctx.db.projectAssignment.deleteMany({
          where: {
            projectId: input.projectId,
            userId: input.userId,
          },
        });
      })
    ),
});
