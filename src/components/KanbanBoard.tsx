/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { useState, useEffect } from "react";
import { Task, TaskStatus } from "@prisma/client";
import { api } from "~/utils/api";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "~/components/Badge";
import { Loader2 } from "lucide-react";

const statusColumns: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const statusLabels = {
  TODO: "📝 To Do",
  IN_PROGRESS: "⏳ In Progress",
  DONE: "✅ Done",
};

const priorityColors = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

export default function KanbanBoard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: projects = [], isLoading: loadingProjects } =
    api.project.getAll.useQuery();

  // Automatically select the first project if none is selected
  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]!.id);
    }
  }, [projects, selectedProject]);

  const {
    data: tasksData,
    refetch,
    isFetching,
  } = api.task.getAll.useQuery(
    { projectId: selectedProject ?? "", skipPagination: true },
    { enabled: !!selectedProject },
  );

  const tasks = tasksData?.tasks ?? [];

  const updateStatus = api.task.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    updateStatus.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Dashboard</h1>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statusColumns.map((status) => (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
              className="bg-muted min-h-[300px] rounded-2xl border border-gray-200 p-4 shadow-inner"
            >
              <h2 className="mb-4 text-xl font-semibold">
                {statusLabels[status]}
              </h2>

              {isFetching && (
                <div className="text-muted-foreground py-8 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                  Loading tasks...
                </div>
              )}

              {tasks
                ?.filter((task) => task.status === status)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="mb-4 cursor-move rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge
                        className={`rounded-full px-2 py-0.5 text-xs ${priorityColors[task.priority ?? "MEDIUM"]}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="mb-2 text-sm text-gray-600">
                        {task.description}
                      </p>
                    )}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        🕒 {formatDistanceToNow(new Date(task.createdAt))} ago
                      </span>
                      {task.deadline && (
                        <span>
                          📅 Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {!isFetching &&
                tasks.filter((t) => t.status === status).length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-400">
                    No tasks
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
