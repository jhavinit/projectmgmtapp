/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { api } from "~/utils/api";
import { useState } from "react";
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
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ConfirmDialog from "~/components/ConfirmDialog";
import NoDataFound from "~/components/NoDataFound";
import { TaskStatus, TaskType, type Task } from "@prisma/client";
import { useRouter } from "next/router";
import Loading from "~/components/Loading";
import { BackButton } from "~/components/BackButton";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { useDebounce } from "use-debounce"; // Add this at the top (install with: npm i use-debounce)

// Icon helper for type
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

// Icon helper for priority
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

export default function TasksPage() {
  const utils = api.useContext();
  const { data: session } = useSession();

  const { data: users } = api.user.getAll.useQuery(); // example api call to fetch users

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const [filterType, setFilterType] = useState<TaskType | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "ALL"
  >("ALL");

  // Add status filter state
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");

  const router = useRouter();
  const projectId = router.query.id as string;
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Search state
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400); // Debounce for better UX

  const { data: tasksData, isLoading } = api.task.getAll.useQuery({
    projectId,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    type: filterType,
    priority: filterPriority,
    status: filterStatus, // <-- pass status to backend
    search: debouncedSearch,
  });

  const tasks = tasksData?.tasks ?? [];
  const totalPages = tasksData?.totalPages ?? 1;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const [taskId, setTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [tags, setTags] = useState<string[]>([]);
  const [assignedToId, setAssignedToId] = useState<string | undefined>();

  const [type, setType] = useState<TaskType>(TaskType.FEATURE);

  // View mode: grid or list
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const resetForm = () => {
    setTaskId(null);
    setTitle("");
    setDescription("");
    setDeadline("");
    setPriority("LOW");
    setTags([]);
    setAssignedToId(undefined);
    setIsEditMode(false);
    setType(TaskType.FEATURE);
  };

  const openDrawerForCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

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
    setType(task.type);
    setStatus(task.status);
  };

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

  const handleFormSubmit = () => {
    const taskData = {
      title,
      description,
      deadline: new Date(deadline),
      priority,
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
    <div className="flex min-h-screen flex-col bg-gray-50 p-6">
      <BackButton />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <div className="flex gap-3">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            style={{ minWidth: 200 }}
          />

          <button
            onClick={() => setViewMode("grid")}
            title="Grid View"
            className={`rounded p-2 hover:bg-gray-200 ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="List View"
            className={`rounded p-2 hover:bg-gray-200 ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            <List size={20} />
          </button>

          <button
            onClick={openDrawerForCreate}
            className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Task
          </button>
        </div>
      </div>

      {/* Filters - Always visible */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Filter by Type */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TaskType | "ALL")}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="ALL">All</option>
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
          </select>
        </div>

        {/* Filter by Priority */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(e.target.value as typeof filterPriority)
            }
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="ALL">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Filter by Status */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as TaskStatus | "ALL")
            }
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="ALL">All</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {/* Task List */}
          {tasks.length > 0 ? (
            <div className="space-y-6">
              {viewMode === "grid" ? (
                <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="relative flex h-64 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white p-6 shadow-md hover:shadow-lg"
                    >
                      {/* Icon */}
                      <div className="absolute left-4 top-4 rounded bg-blue-700 p-2 text-white shadow">
                        <TaskTypeIcon type={task.type} />
                      </div>

                      {/* Title */}
                      <h3
                        className="mb-2 ml-10 truncate text-xl font-semibold"
                        title={task.title}
                      >
                        {task.title}
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
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

                      {/* Description (line-clamp-3 already present) */}
                      <p className="mb-1 ml-10 line-clamp-3 flex-grow overflow-hidden text-sm text-gray-600">
                        {task.description}
                      </p>

                      {/* Metadata */}
                      <div className="mb-2 ml-10 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
                        <div className="ml-10 mt-3 flex max-h-12 flex-wrap gap-2 overflow-y-auto pr-1">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex max-w-[6rem] items-center truncate rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600"
                              title={tag}
                            >
                              <Tag size={12} className="mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="ml-10 mt-5 mt-auto flex justify-end gap-2">
                        <button
                          onClick={() => openDrawerForEdit(task)}
                          className="flex items-center gap-1 rounded bg-yellow-400 px-3 py-1 text-sm text-gray-800 hover:bg-yellow-500"
                          title="Edit Task"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(task.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex items-center gap-1 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                          title="Delete Task"
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

                <ul className="flex flex-col divide-y divide-gray-300 rounded bg-white shadow">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="rounded bg-blue-700 p-2 text-white shadow">
                          <TaskTypeIcon type={task.type} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="flex items-center gap-2 truncate text-lg font-semibold">
                            {task.title}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                                className="inline-flex items-center rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600"
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
                          className="flex items-center gap-1 rounded bg-yellow-400 px-3 py-1 text-sm text-gray-800 hover:bg-yellow-500"
                          title="Edit Task"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(task.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex items-center gap-1 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Pagination Controls - Only show when there are tasks */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
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
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-auto rounded bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {isEditMode ? "Edit Task" : "Create Task"}
              </h2>
              <button onClick={() => setDrawerOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFormSubmit();
              }}
              className="space-y-4"
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
