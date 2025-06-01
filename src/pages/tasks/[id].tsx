import { api } from "~/utils/api";
import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ClipboardList,
  AlertCircle,
  Bug,
  Star,
  List,
  Grid,
  Tag,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ConfirmDialog from "~/components/ConfirmDialog";
import NoDataFound from "~/components/NoDataFound";
// import { TaskStatus, TaskType, type Task } from "@prisma/client";
import type { Task } from "@prisma/client";
import { TaskStatus, TaskType, TaskPriority } from "~/shared/task-constants";

import { useRouter } from "next/router";
import Loading from "~/components/Loading";
import { BackButton } from "~/components/BackButton";
import { useDebounce } from "use-debounce";

/**
 * Icon helper for task type.
 * @param type - TaskType enum value.
 */
function TaskTypeIcon({ type }: { type: TaskType }) {
  switch (type) {
    case TaskType.BUG:
      return <Bug className="inline-block text-white" size={18} />;
    case TaskType.FEATURE:
      return <Star className="inline-block text-white" size={18} />;
    case TaskType.IMPROVEMENT:
      return <AlertCircle className="inline-block text-white" size={18} />;
    default:
      return <ClipboardList className="inline-block text-white" size={18} />;
  }
}

/**
 * Icon helper for priority.
 * @param priority - Task priority string.
 */
function PriorityIcon({ priority }: { priority: "LOW" | "MEDIUM" | "HIGH" }) {
  switch (priority) {
    case "HIGH":
      return <AlertCircle className="text-red-600" size={16} />;
    case "MEDIUM":
      return <AlertCircle className="text-yellow-500" size={16} />;
    case "LOW":
      return <AlertCircle className="text-green-600" size={16} />;
    default:
      return null;
  }
}

/**
 * TasksPage displays all tasks for a project,
 * allows creation, editing, deletion, filtering, and pagination.
 */
export default function TasksPage() {
  const utils = api.useContext();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: users = [] } = api.user.getAll.useQuery();

  // Filter states
  const [filterType, setFilterType] = useState<TaskType | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "ALL"
  >("ALL");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");

  // Router and project context
  const router = useRouter();
  const projectId = router.query.id as string;

  // Task form states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Set today's date as default for deadline
  // const today = new Date().toISOString().slice(0, 10);
  // const [deadline, setDeadline] = useState(today);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // Add 1 day
  const defaultDeadline = tomorrow.toISOString().slice(0, 10); // Format: YYYY-MM-DD
  const [deadline, setDeadline] = useState(defaultDeadline);

  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [tags, setTags] = useState<string[]>([]);
  const [assignedToId, setAssignedToId] = useState<string | undefined>(
    currentUserId,
  );
  const [type, setType] = useState<TaskType>(TaskType.FEATURE);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400);

  // View mode: grid or list
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch tasks with filters, pagination, and search
  const { data: tasksData, isLoading } = api.task.getAll.useQuery({
    projectId,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    type: filterType === "ALL" ? undefined : filterType,
    priority:
      filterPriority === "ALL" ? undefined : (filterPriority as TaskPriority),
    status: filterStatus === "ALL" ? undefined : filterStatus,
    search: debouncedSearch,
  });

  const tasks = tasksData?.tasks ?? [];
  const totalPages = tasksData?.totalPages ?? 1;

  /**
   * Reset the task form state.
   */
  const resetForm = () => {
    setTaskId(null);
    setTitle("");
    setDescription("");
    setDeadline(defaultDeadline);
    setPriority("LOW");
    setTags([]);
    setAssignedToId(currentUserId); // <-- Default to logged-in user
    setIsEditMode(false);
    setType(TaskType.FEATURE);
    setStatus(TaskStatus.TODO);
  };

  /**
   * Open the drawer for creating a new task.
   */
  const openDrawerForCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  /**
   * Open the drawer for editing an existing task.
   * @param task - The task to edit.
   */
  const openDrawerForEdit = (task: Task) => {
    setTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setDeadline(task.deadline?.toISOString().slice(0, 10) ?? "");
    setPriority(task.priority);
    setTags(task.tags ?? []);
    setAssignedToId(task.assignedToId ?? undefined);
    setIsEditMode(true);
    setDrawerOpen(true);
    setType(task.type as TaskType);
    setStatus(task.status as TaskStatus);
  };

  // Mutations for create, update, and delete
  const createTask = api.task.create.useMutation({
    onSuccess: async () => {
      await utils.task.getAll.invalidate();
      toast.success("Task created");
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateTask = api.task.update.useMutation({
    onSuccess: async () => {
      await utils.task.getAll.invalidate();
      toast.success("Task updated");
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to update task"),
  });

  const deleteTask = api.task.delete.useMutation({
    onSuccess: async () => {
      await utils.task.getAll.invalidate();
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });

  /**
   * Handle create or update form submission.
   */
  const handleFormSubmit = () => {
    const taskData = {
      title,
      description,
      deadline: new Date(deadline),
      priority: priority as TaskPriority,
      tags,
      projectId,
      assignedToId,
      type,
      status,
    };

    if (isEditMode && taskId) {
      updateTask.mutate({
        id: taskId,
        ...taskData,
      });
    } else {
      createTask.mutate(taskData);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <BackButton />

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList size={36} className="text-blue-600" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-900">
            Tasks
          </h1>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-blue-200 px-4 py-2 text-sm shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            style={{ minWidth: 220 }}
            aria-label="Search tasks"
          />
          <button
            onClick={() => setViewMode("grid")}
            title="Grid View"
            className={`rounded-lg p-2 shadow transition ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-blue-100"
            }`}
            aria-label="Grid View"
            aria-pressed={viewMode === "grid"}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="List View"
            className={`rounded-lg p-2 shadow transition ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-blue-100"
            }`}
            aria-label="List View"
            aria-pressed={viewMode === "list"}
          >
            <List size={20} />
          </button>
          <button
            onClick={openDrawerForCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-lg font-semibold text-white shadow transition hover:bg-blue-700"
            aria-label="Create Task"
          >
            <Plus size={20} />
            Create Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-white/80 p-4 shadow">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-blue-400" />
          <span className="text-sm font-medium">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TaskType | "ALL")}
            className="rounded border border-blue-200 px-2 py-1 text-sm focus:border-blue-400"
            aria-label="Filter by type"
          >
            <option value="ALL">All</option>
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-400" />
          <span className="text-sm font-medium">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(e.target.value as typeof filterPriority)
            }
            className="rounded border border-yellow-200 px-2 py-1 text-sm focus:border-yellow-400"
            aria-label="Filter by priority"
          >
            <option value="ALL">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ListChecks size={16} className="text-green-400" />
          <span className="text-sm font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as TaskStatus | "ALL")
            }
            className="rounded border border-green-200 px-2 py-1 text-sm focus:border-green-400"
            aria-label="Filter by status"
          >
            <option value="ALL">All</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-8">
          {tasks.length > 0 ? (
            <div className="space-y-8">
              {viewMode === "grid" ? (
                <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="relative flex flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-lg transition hover:shadow-2xl"
                    >
                      {/* Icon */}
                      <div className="absolute left-4 top-4 rounded-full bg-blue-700 p-2 text-white shadow">
                        <TaskTypeIcon type={task.type as TaskType} />
                      </div>
                      {/* Title */}
                      <h3
                        className="mb-2 ml-12 truncate text-xl font-bold text-blue-900"
                        title={task.title}
                      >
                        {task.title}
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            task.status === "TODO"
                              ? "bg-gray-200 text-gray-700"
                              : task.status === "IN_PROGRESS"
                                ? "bg-yellow-200 text-yellow-800"
                                : task.status === "DONE"
                                  ? "bg-green-200 text-green-800"
                                  : "bg-gray-100 text-gray-500"
                          } `}
                        >
                          {task.status}
                        </span>
                      </h3>
                      {/* Description */}
                      <p className="mb-1 ml-12 line-clamp-3 flex-grow overflow-hidden text-sm text-gray-600">
                        {task.description}
                      </p>
                      {/* Metadata */}
                      <div className="mb-2 ml-12 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1 truncate">
                          <Clock size={14} />
                          Deadline:{" "}
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <PriorityIcon priority={task.priority} />
                          <span className="font-semibold">{task.priority}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <User size={14} />
                          {users?.find((u) => u.id === task.assignedToId)
                            ?.name ?? "Unassigned"}
                        </div>
                      </div>
                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="ml-12 mt-3 flex max-h-12 flex-wrap gap-2 overflow-y-auto pr-1">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex max-w-[6rem] items-center truncate rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                              title={tag}
                            >
                              <Tag size={12} className="mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Buttons */}
                      <div className="ml-12 mt-5 mt-auto flex justify-end gap-2">
                        <button
                          onClick={() => openDrawerForEdit(task)}
                          className="flex items-center gap-1 rounded-lg bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-gray-800 transition hover:bg-yellow-500"
                          title="Edit Task"
                          aria-label="Edit Task"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(task.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-red-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600"
                          title="Delete Task"
                          aria-label="Delete Task"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                // List view
                <ul className="flex flex-col divide-y divide-blue-100 rounded-2xl bg-white shadow-lg">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-4 px-8 py-5 transition hover:bg-blue-50"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="rounded-full bg-blue-700 p-2 text-white shadow">
                          <TaskTypeIcon type={task.type as TaskType} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="flex items-center gap-2 truncate text-lg font-bold text-blue-900">
                            {task.title}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                task.status === "TODO"
                                  ? "bg-gray-200 text-gray-700"
                                  : task.status === "IN_PROGRESS"
                                    ? "bg-yellow-200 text-yellow-800"
                                    : task.status === "DONE"
                                      ? "bg-green-200 text-green-800"
                                      : "bg-gray-100 text-gray-500"
                              } `}
                            >
                              {task.status}
                            </span>
                          </h3>
                          <p className="truncate text-sm text-gray-600">
                            {task.description}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(task.deadline).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <PriorityIcon priority={task.priority} />
                              {task.priority}
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              {users?.find((u) => u.id === task.assignedToId)
                                ?.name ?? "Unassigned"}
                            </div>
                            {task.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                              >
                                <Tag size={12} className="mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDrawerForEdit(task)}
                          className="flex items-center gap-1 rounded-lg bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-gray-800 transition hover:bg-yellow-500"
                          title="Edit Task"
                          aria-label="Edit Task"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(task.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-red-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600"
                          title="Delete Task"
                          aria-label="Delete Task"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Pagination Controls */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm font-medium text-blue-900">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  aria-label="Next Page"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <NoDataFound />
          )}
        </div>
      )}

      {/* Drawer for create/edit */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setDrawerOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={24} className="text-blue-600" />
                <h2 className="text-2xl font-bold">
                  {isEditMode ? "Edit Task" : "Create Task"}
                </h2>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
                aria-label="Close Drawer"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFormSubmit();
              }}
              className="space-y-4"
              aria-label={isEditMode ? "Edit Task Form" : "Create Task Form"}
            >
              <div>
                <label htmlFor="title" className="mb-1 block font-semibold">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2"
                  aria-required="true"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block font-semibold"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full resize-none rounded border border-gray-300 p-2"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="status" className="mb-1 block font-semibold">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full rounded border border-gray-300 p-2"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Completed</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex min-w-[150px] flex-1 flex-col">
                  <label htmlFor="deadline" className="mb-1 font-semibold">
                    Deadline
                  </label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="rounded border border-gray-300 p-2"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="flex min-w-[150px] flex-1 flex-col">
                  <label htmlFor="priority" className="mb-1 font-semibold">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
                    }
                    className="rounded border border-gray-300 p-2"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="flex min-w-[150px] flex-1 flex-col">
                  <label htmlFor="type" className="mb-1 font-semibold">
                    Task Type
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as TaskType)}
                    className="rounded border border-gray-300 p-2"
                  >
                    <option value={TaskType.FEATURE}>Feature</option>
                    <option value={TaskType.BUG}>Bug</option>
                    <option value={TaskType.IMPROVEMENT}>Improvement</option>
                  </select>
                </div>

                <div className="flex min-w-[150px] flex-1 flex-col">
                  <label htmlFor="assignedTo" className="mb-1 font-semibold">
                    Assigned To
                  </label>
                  <select
                    id="assignedTo"
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="rounded border border-gray-300 p-2"
                  >
                    <option value="">Unassigned</option>
                    {users?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="mb-1 block font-semibold">
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tags.join(", ")}
                  onChange={(e) =>
                    setTags(e.target.value.split(",").map((t) => t.trim()))
                  }
                  className="w-full rounded border border-gray-300 p-2"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    resetForm();
                  }}
                  className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  {isEditMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          btnText="Delete"
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            if (taskToDelete) deleteTask.mutate({ id: taskToDelete });
            setDeleteDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
