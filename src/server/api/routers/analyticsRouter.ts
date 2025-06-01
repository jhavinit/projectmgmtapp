import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { handleApiError } from "../error-handler";

/**
 * Analytics router for project management app.
 * Provides endpoints for user, project, and task analytics.
 */
export const analyticsRouter = createTRPCRouter({
  /**
   * Get total user count and top users by assigned tasks.
   * @returns {Promise<{ totalUsers: number; topUsers: Array<any> }>}
   */
  userStats: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      const totalUsers = await ctx.db.user.count();

      // Top 5 users with the most assigned tasks
      const topUsers = await ctx.db.user.findMany({
        take: 5,
        orderBy: {
          tasksAssigned: { _count: "desc" },
        },
        include: {
          _count: { select: { tasksAssigned: true } },
        },
      });

      return { totalUsers, topUsers };
    })
  ),

  /**
   * Get active user count per project.
   * @returns {Promise<Array<{ projectId: string; _count: { userId: number } }>>}
   */
  activeUsersPerProject: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      const data = await ctx.db.projectAssignment.groupBy({
        by: ["projectId"],
        _count: { userId: true },
      });
      return data;
    })
  ),

  /**
   * Get project statistics: total projects, average users per project, and projects with most tasks.
   * @returns {Promise<{ totalProjects: number; avgUsersPerProject: number; projectsWithMostTasks: Array<any> }>}
   */
  projectStats: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      const totalProjects = await ctx.db.project.count();
      const assignments = await ctx.db.projectAssignment.count();
      const avgUsersPerProject =
        totalProjects === 0 ? 0 : assignments / totalProjects;

      // Top 5 projects with the most tasks
      const projectsWithMostTasks = await ctx.db.project.findMany({
        take: 5,
        orderBy: {
          tasks: { _count: "desc" },
        },
        include: {
          _count: { select: { tasks: true } },
        },
      });

      return { totalProjects, avgUsersPerProject, projectsWithMostTasks };
    })
  ),

  /**
   * Get task statistics: status, priority, overdue, average per user, and type breakdown.
   * @returns {Promise<object>}
   */
  taskStats: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      // Breakdown by status
      const statusBreakdown = await ctx.db.task.groupBy({
        by: ["status"],
        _count: { _all: true },
      });

      // Breakdown by priority
      const priorityBreakdown = await ctx.db.task.groupBy({
        by: ["priority"],
        _count: { _all: true },
      });

      // Count of overdue tasks (not done and deadline in the past)
      const overdueTasks = await ctx.db.task.count({
        where: {
          deadline: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      });

      // Average tasks per user
      const totalTasks = await ctx.db.task.count();
      const totalUsers = await ctx.db.user.count();
      const avgTasksPerUser = totalUsers === 0 ? 0 : totalTasks / totalUsers;

      // Breakdown by type
      const typeBreakdown = await ctx.db.task.groupBy({
        by: ["type"],
        _count: { _all: true },
      });

      return {
        statusBreakdown,
        priorityBreakdown,
        overdueTasks,
        avgTasksPerUser,
        typeBreakdown,
        totalTasks,
      };
    })
  ),

  /**
   * Compare number of tasks created vs assigned per user.
   * @returns {Promise<{ created: Array<any>; assigned: Array<any> }>}
   */
  tasksCreatedVsAssigned: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      // Group by creator
      const created = await ctx.db.task.groupBy({
        by: ["createdById"],
        _count: { _all: true },
      });

      // Group by assignee
      const assigned = await ctx.db.task.groupBy({
        by: ["assignedToId"],
        _count: { _all: true },
      });

      return { created, assigned };
    })
  ),

  /**
   * Get time-based statistics: tasks/projects per month and average completion time.
   * @returns {Promise<{ tasksPerMonth: Array<any>; projectsPerMonth: Array<any>; avgCompletionTime: number }>}
   */
  timeBasedStats: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      // Tasks created per month (last 12 months)
      const tasksPerMonth = await ctx.db.$queryRawUnsafe<
        { month: string; count: number }[]
      >(`
        SELECT
          to_char(DATE_TRUNC('month', "createdAt"), 'YYYY-MM-01') as month,
          COUNT(*)::int as count
        FROM "Task"
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `);

      // Projects created per month (last 12 months)
      const projectsPerMonth = await ctx.db.$queryRawUnsafe<
        { month: string; count: number }[]
      >(`
        SELECT
          to_char(DATE_TRUNC('month', "createdAt"), 'YYYY-MM-01') as month,
          COUNT(*)::int as count
        FROM "Project"
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `);

      // Calculate average completion time for completed tasks (in days)
      const completionTimes = await ctx.db.task.findMany({
        where: { status: TaskStatus.DONE },
        select: { createdAt: true, updatedAt: true },
      });

      const avgCompletionTime =
        completionTimes.length === 0
          ? 0
          : completionTimes.reduce(
            (sum, t) =>
              sum +
              (t.updatedAt.getTime() - t.createdAt.getTime()) /
              (1000 * 60 * 60 * 24),
            0,
          ) / completionTimes.length;

      return { tasksPerMonth, projectsPerMonth, avgCompletionTime };
    })
  ),

  /**
   * Get project quality metrics: completion rate and average priority.
   * @returns {Promise<{ rates: Array<any>; avgPriority: number }>}
   */
  projectQuality: protectedProcedure.query(({ ctx }) =>
    handleApiError(async () => {
      // Average task completion rate per project
      const projects = await ctx.db.project.findMany({
        include: {
          tasks: true,
        },
      });

      const rates = projects.map((p) => {
        const total = p.tasks.length;
        const done = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
        return { projectId: p.id, rate: total === 0 ? 0 : done / total };
      });

      // Average priority score (LOW=1, MEDIUM=2, HIGH=3)
      const priorities = await ctx.db.task.findMany({
        select: { priority: true },
      });

      const PRIORITY_SCORE: Record<TaskPriority, number> = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
      };

      const avgPriority =
        priorities.length === 0
          ? 0
          : priorities.reduce((sum, t) => sum + PRIORITY_SCORE[t.priority], 0) /
          priorities.length;

      return { rates, avgPriority };
    })
  ),
});
