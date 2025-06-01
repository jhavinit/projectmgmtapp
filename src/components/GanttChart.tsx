"use client";

import { useState, useEffect } from "react";
import type { TaskStatus, Task as PrismaTask } from "@prisma/client";
import { api } from "~/utils/api";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { FolderKanban } from "lucide-react";

/**
 * Maps TaskStatus to progress percentage for Gantt chart.
 */
const STATUS_PROGRESS: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 50,
  DONE: 100,
};

/**
 * GanttChartDashboard displays a Gantt chart for tasks in a selected project.
 * Handles project selection, task formatting, and loading states.
 */
export default function GanttChartDashboard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Fetch all projects for the dropdown
  const { data: projects = [], isLoading: loadingProjects } =
    api.project.getAll.useQuery();

  // Automatically select the first project if none is selected
  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]!.id);
    }
  }, [projects, selectedProject]);

  // Fetch all tasks for the selected project (no pagination)
  const { data: tasksData, isFetching } = api.task.getAll.useQuery(
    { projectId: selectedProject ?? "", skipPagination: true },
    { enabled: !!selectedProject },
  );

  const tasks: PrismaTask[] = tasksData?.tasks ?? [];

  /**
   * Formats tasks from Prisma to Gantt chart format.
   * @param tasks - Array of Prisma tasks
   * @returns Array of GanttTask objects
   */
  const formatTasks = (tasks: PrismaTask[]): Task[] =>
    tasks.map((task) => ({
      id: task.id,
      name: task.title,
      start: new Date(task.createdAt), // TODO: Use task.startDate if available
      end: new Date(task.deadline ?? Date.now() + 1000 * 60 * 60 * 24), // fallback to +1 day
      progress: STATUS_PROGRESS[task.status] ?? 0,
      type: "task",
      isDisabled: false,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header with project selector */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderKanban
            size={32}
            className="text-blue-600"
            aria-hidden="true"
          />
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-900">
            Gantt Chart Dashboard
          </h1>
        </div>
        <div className="w-72">
          <label htmlFor="project-select" className="sr-only">
            Select Project
          </label>
          <select
            id="project-select"
            className="w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-base shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={selectedProject ?? ""}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={projects.length === 0}
            aria-label="Select Project"
          >
            <option value="" disabled>
              {projects.length === 0
                ? "No projects available"
                : "Select a project"}
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state for projects */}
      {loadingProjects && (
        <div
          className="flex items-center gap-2 text-blue-600"
          role="status"
          aria-live="polite"
        >
          <span className="animate-spin" aria-hidden="true">
            ⏳
          </span>{" "}
          Loading projects...
        </div>
      )}

      {/* No projects available */}
      {!selectedProject && !loadingProjects && projects.length === 0 && (
        <div className="text-gray-500" tabIndex={0}>
          No projects found.
        </div>
      )}

      {/* Gantt Chart */}
      {selectedProject && (
        <div className="overflow-x-auto rounded-2xl border border-blue-100 bg-white/80 p-6 shadow-lg">
          {isFetching ? (
            <div
              className="py-10 text-center text-blue-400"
              role="status"
              aria-live="polite"
            >
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-gray-400" tabIndex={0}>
              No tasks available for this project.
            </div>
          ) : (
            <Gantt
              tasks={formatTasks(tasks)}
              viewMode={ViewMode.Day}
              listCellWidth="155px"
              locale="en-GB"
            />
          )}
        </div>
      )}
    </div>
  );
}
