import { useState, useEffect } from "react";
import type { Task } from "@prisma/client";
import { api } from "~/utils/api";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "~/components/Badge";
import {
  Loader2,
  CheckCircle2,
  Hourglass,
  Pencil,
  Star,
  Tag,
  FolderKanban,
  User,
  CalendarDays,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "~/shared/task-constants";

/**
 * Kanban status columns and their order.
 * Move to a shared constants/types file if reused elsewhere.
 */
const STATUS_COLUMNS = ["TODO", "IN_PROGRESS", "DONE"];

const STATUS_ICONS = {
  TODO: <Pencil size={18} className="text-blue-400" aria-hidden="true" />,
  IN_PROGRESS: (
    <Hourglass size={18} className="text-yellow-400" aria-hidden="true" />
  ),
  DONE: (
    <CheckCircle2 size={18} className="text-green-500" aria-hidden="true" />
  ),
};

const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_COLORS = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

/**
 * KanbanBoard displays tasks grouped by status for a selected project.
 * Supports drag-and-drop for status updates and project selection.
 */
export default function KanbanBoard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: users } = api.user.getAll.useQuery();

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
  const {
    data: tasksData,
    refetch,
    isFetching,
  } = api.task.getAll.useQuery(
    { projectId: selectedProject ?? "", skipPagination: true },
    { enabled: !!selectedProject },
  );

  const tasks: Task[] = tasksData?.tasks ?? [];

  // Mutation for updating task status
  const updateStatus = api.task.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  /**
   * Handles drag start event for a task card.
   * @param e - Drag event
   * @param taskId - The ID of the task being dragged
   */
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  /**
   * Handles drop event on a status column.
   * Updates the task's status.
   * @param e - Drag event
   * @param newStatus - The new status for the dropped task
   */
  // Import TaskStatus from the correct source

  interface HandleDropEvent extends React.DragEvent {
    dataTransfer: DataTransfer;
  }

  const handleDrop = (e: HandleDropEvent, newStatus: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateStatus.mutate({ id: taskId, status: newStatus });
    }
  };

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
            Kanban Dashboard
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
          <Loader2 className="animate-spin" aria-hidden="true" /> Loading
          projects...
        </div>
      )}

      {/* No projects available */}
      {!selectedProject && !loadingProjects && projects.length === 0 && (
        <div className="text-gray-500" tabIndex={0}>
          No projects found.
        </div>
      )}

      {/* Kanban columns */}
      {selectedProject && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STATUS_COLUMNS.map((status) => {
            const typedStatus = status as keyof typeof STATUS_LABELS;
            return (
              <section
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, status as TaskStatus)}
                className="flex min-h-[350px] flex-col rounded-2xl border border-blue-100 bg-white/80 p-4 shadow-lg"
                aria-label={`${STATUS_LABELS[typedStatus]} Column`}
              >
                {/* Column header */}
                <div className="mb-4 flex items-center gap-2 text-lg font-bold">
                  {STATUS_ICONS[typedStatus]}
                  <span
                    className={
                      status === "TODO"
                        ? "text-blue-700"
                        : status === "IN_PROGRESS"
                          ? "text-yellow-700"
                          : "text-green-700"
                    }
                  >
                    {STATUS_LABELS[typedStatus]}
                  </span>
                </div>

                {/* Loading tasks */}
                {isFetching && (
                  <div
                    className="py-8 text-center text-blue-400"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2
                      className="mx-auto animate-spin"
                      aria-hidden="true"
                    />
                    Loading tasks...
                  </div>
                )}

                {/* Task cards */}
                {tasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="mb-4 cursor-move rounded-xl border border-blue-100 bg-white p-4 shadow transition hover:shadow-xl"
                      aria-label={`Task: ${task.title}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="truncate font-semibold text-blue-900">
                          {task.title}
                        </h3>
                        <Badge
                          className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_COLORS[task.priority ?? "MEDIUM"]}`}
                        >
                          <Star
                            size={13}
                            className="mr-1 inline-block"
                            aria-hidden="true"
                          />
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="mb-2 line-clamp-3 text-sm text-gray-600">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={13} aria-hidden="true" />{" "}
                          {users?.find((u) => u.id === task.assignedToId)
                            ?.name ?? "Unassigned"}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} aria-hidden="true" />
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString()
                            : "No deadline"}
                        </span>
                        <span>
                          <Tag
                            size={13}
                            className="mr-1 inline-block"
                            aria-hidden="true"
                          />
                          {task.tags?.join(", ")}
                        </span>
                        <span>
                          🕒 {formatDistanceToNow(new Date(task.createdAt))} ago
                        </span>
                      </div>
                    </article>
                  ))}

                {/* Empty column state */}
                {!isFetching &&
                  tasks.filter((t) => t.status === status).length === 0 && (
                    <div
                      className="py-4 text-center text-sm text-gray-400"
                      tabIndex={0}
                    >
                      No tasks
                    </div>
                  )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
