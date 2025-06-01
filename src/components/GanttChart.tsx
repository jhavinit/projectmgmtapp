/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

"use client";

import { useState, useEffect } from "react";
import { TaskStatus } from "@prisma/client";
import { api } from "~/utils/api";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

const statusProgress = {
  TODO: 0,
  IN_PROGRESS: 50,
  DONE: 100,
};

export default function GanttDashboard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { data: projects = [], isLoading: loadingProjects } =
    api.project.getAll.useQuery();

  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]!.id);
    }
  }, [projects, selectedProject]);

  const {
    data: tasksData,
    isFetching,
    refetch,
  } = api.task.getAll.useQuery(
    { projectId: selectedProject ?? "", skipPagination: true },
    { enabled: !!selectedProject },
  );

  const tasks = tasksData?.tasks ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTasks = (tasks: any[]): Task[] =>
    tasks.map((task) => ({
      id: task.id,
      name: task.title,
      start: new Date(task.createdAt), // Replace with `task.startDate` if available
      end: new Date(task.deadline ?? Date.now() + 1000 * 60 * 60 * 24), // fallback to +1 day
      progress: statusProgress[task.status as TaskStatus] ?? 0,
      type: "task",
      isDisabled: false,
    }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Gantt Chart Dashboard</h1>
        <div className="w-64">
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProject ?? ""}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={projects.length === 0}
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

      {loadingProjects && (
        <div className="text-gray-600">Loading projects...</div>
      )}

      {!selectedProject && !loadingProjects && projects.length === 0 && (
        <div className="text-gray-500">No projects found.</div>
      )}

      {selectedProject && (
        <div className="overflow-x-auto rounded-lg border p-4 shadow-md">
          {isFetching ? (
            <div className="py-10 text-center text-gray-500">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
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
