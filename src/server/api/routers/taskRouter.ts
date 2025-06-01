import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { handleApiError } from "../error-handler";
import { TaskStatus, TaskType, TaskPriority } from "~/shared/task-constants";

/**
 * TRPC router for task-related operations.
 * Handles CRUD, filtering, pagination, and status updates for tasks.
 */
export const taskRouter = createTRPCRouter({
  /**
   * Update the status of a task.
   * @param id - Task ID.
   * @param status - New status for the task.
   * @returns The updated task.
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(TaskStatus).refine((val) => val !== TaskStatus.ALL, {
          message: '"ALL" is not a valid status for updating a task',
        }),
      }),
    )
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Update the status of a task by ID
        return ctx.db.task.update({
          where: { id: input.id },
          data: { status: input.status },
        });
      })
    ),

  /**
   * Get all tasks for a project with filtering, search, and pagination.
   * @param projectId - Project ID.
   * @param page - Page number for pagination.
   * @param limit - Number of tasks per page.
   * @param type - Filter by task type.
   * @param priority - Filter by priority.
   * @param status - Filter by status.
   * @param skipPagination - If true, returns all tasks.
   * @param search - Search query for title, description, or tags.
   * @returns Paginated or full list of tasks.
   */
  getAll: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        type: z.nativeEnum(TaskType).optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        skipPagination: z.boolean().optional(),
        search: z.string().optional(),
      }),
    )
    .query(({ ctx, input }) =>
      handleApiError(async () => {
        const { search } = input;

        // Filter for tasks assigned to or created by the current user
        const userFilter = [
          { assignedToId: ctx.session.user.id },
          { createdById: ctx.session.user.id },
        ];

        // Build search filter if search term is provided
        let searchFilter = {};
        if (search?.trim()) {
          searchFilter = {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { tags: { has: search } },
            ],
          };
        }

        // Combine all filters for querying tasks
        const where = {
          projectId: input.projectId,
          ...(input.type && input.type !== TaskType.ALL ? { type: input.type } : {}),
          ...(input.priority && input.priority !== TaskPriority.ALL
            ? { priority: input.priority }
            : {}),
          ...(input.status && input.status !== TaskStatus.ALL
            ? { status: input.status }
            : {}),
          AND: [
            {
              OR: userFilter,
            },
            ...(search?.trim() ? [searchFilter] : []),
          ],
        };

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

        // Paginated results
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
      })
    ),

  /**
   * Create a new task.
   * @param input - Task creation data.
   * @returns The created task.
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        deadline: z.date(),
        priority: z.nativeEnum(TaskPriority),
        tags: z.array(z.string()),
        projectId: z.string(),
        assignedToId: z.string().optional(),
        status: z.nativeEnum(TaskStatus).refine((val) => val !== TaskStatus.ALL, {
          message: '"ALL" is not a valid status for updating a task',
        }),
        type: z.nativeEnum(TaskType),
      }),
    )
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Create a new task with the provided data
        return ctx.db.task.create({
          data: {
            title: input.title,
            description: input.description,
            deadline: input.deadline,
            priority: input.priority !== TaskPriority.ALL ? input.priority : undefined,
            tags: input.tags,
            projectId: input.projectId,
            assignedToId: input.assignedToId,
            createdById: ctx.session.user.id,
            status: input.status,
            type: input.type !== TaskType.ALL ? input.type : undefined,
          },
        });
      })
    ),

  /**
   * Update an existing task.
   * @param input - Task update data.
   * @returns The updated task.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        status: z.nativeEnum(TaskStatus).refine((val) => val !== TaskStatus.ALL, {
          message: '"ALL" is not a valid status for updating a task',
        }),
        deadline: z.date(),
        priority: z.nativeEnum(TaskPriority),
        tags: z.array(z.string()),
        assignedToId: z.string().optional(),
        type: z.nativeEnum(TaskType),
      }),
    )
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Update an existing task by ID with the provided data
        return ctx.db.task.update({
          where: { id: input.id },
          data: {
            title: input.title,
            description: input.description,
            status: input.status,
            deadline: input.deadline,
            priority: input.priority !== TaskPriority.ALL ? input.priority : undefined,
            tags: input.tags,
            assignedToId: input.assignedToId,
            type: input.type !== TaskType.ALL ? input.type : undefined,
          },
        });
      })
    ),

  /**
   * Delete a task by ID.
   * @param id - Task ID.
   * @returns The deleted task.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      handleApiError(async () => {
        // Delete a task by its ID
        return ctx.db.task.delete({ where: { id: input.id } });
      })
    ),
});