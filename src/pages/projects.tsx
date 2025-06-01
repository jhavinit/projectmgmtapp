import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import DOMPurify from "dompurify";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  FileText,
  ClipboardList,
  Users,
  Sparkles,
  CalendarDays,
  FolderKanban,
  User as UserIcon,
  Info,
  FilePlus2,
} from "lucide-react";
import type { Project, User, ProjectAssignment } from "@prisma/client";
import { api } from "~/utils/api";
import ConfirmDialog from "~/components/ConfirmDialog";
import NoDataFound from "~/components/NoDataFound";
import Loading from "~/components/Loading";
import "react-quill/dist/quill.snow.css";

/**
 * Type for a project with its assignments.
 * Move to a shared types file if reused elsewhere.
 */
type ProjectWithAssignments = Project & {
  projectAssignments: Pick<ProjectAssignment, "userId">[];
};

/**
 * ProjectsPage displays all projects for the current user,
 * allows creation, editing, deletion, and AI summary generation.
 */
export default function ProjectsPage() {
  // Dynamically import ReactQuill only on the client
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    [],
  );

  // State for project form and UI
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // API hooks
  const { data: users = [] } = api.user.getAll.useQuery();
  const { data: projects, isLoading } = api.project.getAll.useQuery();
  const generateSummary = api.project.generateSummary.useMutation();
  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.getAll.invalidate();
      toast.success("Project created");
      resetForm();
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to create project"),
  });
  const editProject = api.project.edit.useMutation({
    onSuccess: async () => {
      await utils.project.getAll.invalidate();
      toast.success("Project updated");
      resetForm();
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to update project"),
  });
  const deleteProject = api.project.delete.useMutation({
    onSuccess: async () => {
      await utils.project.getAll.invalidate();
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });

  const router = useRouter();
  const { data: session } = useSession();
  const utils = api.useContext();

  /**
   * Reset the project form state.
   */
  const resetForm = () => {
    setName("");
    setDetails("");
    setProjectId(null);
    setIsEditMode(false);
    setSummary(null);
    setSelectedUserIds([]);
  };

  /**
   * Open the drawer for creating a new project.
   */
  const openDrawerForCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  /**
   * Open the drawer for editing an existing project.
   * @param project - The project to edit.
   */
  const openDrawerForEdit = (project: ProjectWithAssignments) => {
    setName(project.name);
    setDetails(project.details);
    setProjectId(project.id);
    setSummary(project.summary);
    setIsEditMode(true);
    setDrawerOpen(true);
    setSelectedUserIds(
      project.projectAssignments.map((assignment) => assignment.userId),
    );
  };

  /**
   * Handle AI summary generation for project details.
   */
  const handleGenerateSummary = async () => {
    if (!details.trim()) {
      toast.error("Please enter project details to summarize.");
      return;
    }
    try {
      const result = await generateSummary.mutateAsync({ summary: details });
      setSummary(result);
      toast.success("Summary generated");
    } catch (error) {
      toast.error("Failed to generate summary");
    }
  };

  /**
   * Handle project creation or editing form submission.
   */
  const handleFormSubmit = () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please assign at least one user to the project");
      return;
    }
    if (isEditMode && projectId) {
      editProject.mutate({
        id: projectId,
        name,
        details,
        summary: summary ?? "",
        userIds: selectedUserIds,
      });
    } else {
      createProject.mutate({
        name,
        details,
        summary: summary ?? "",
        userIds: selectedUserIds,
      });
    }
  };

  /**
   * Handle confirmation of project deletion.
   */
  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject.mutate({ id: projectToDelete });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  /**
   * Handle cancellation of project deletion.
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban size={36} className="text-blue-600" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-900">
            Projects
          </h1>
        </div>
        <button
          onClick={openDrawerForCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-lg font-semibold text-white shadow transition hover:bg-blue-700"
          aria-label="Create Project"
        >
          <Plus size={22} />
          Create Project
        </button>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <Loading />
      ) : projects && projects.length > 0 ? (
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="relative flex flex-col justify-between rounded-2xl border border-blue-100 bg-white p-6 shadow-lg transition hover:shadow-2xl"
            >
              {/* Project Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 text-blue-700 shadow">
                  <FileText size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-900">
                    {project.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays size={14} />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 shadow-inner">
                <div className="mb-1 flex items-center gap-2 font-medium text-gray-600">
                  <Info size={16} /> Details
                </div>
                {project.details ? (
                  <div
                    className="line-clamp-4"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(project.details),
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm italic text-gray-400">
                    <FilePlus2 size={14} />
                    <span>No details provided.</span>
                  </div>
                )}
              </div>

              {/* AI Summary */}
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm shadow-inner">
                <div className="mb-1 flex items-center gap-2 font-medium text-indigo-600">
                  <Sparkles size={16} /> AI Summary
                </div>
                {project.summary ? (
                  <p className="text-indigo-700">{project.summary}</p>
                ) : (
                  <div className="flex items-center gap-2 text-xs italic text-indigo-400">
                    <FilePlus2 size={12} />
                    <span>No summary available.</span>
                  </div>
                )}
              </div>

              {/* Assigned Users */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Users size={18} className="text-blue-400" />
                {Array.isArray(project.projectAssignments) &&
                project.projectAssignments.length > 0 ? (
                  project.projectAssignments.map((a) => {
                    const user = users.find((u) => u.id === a.userId);
                    return (
                      <span
                        key={a.userId}
                        className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                      >
                        <UserIcon size={14} /> {user?.name ?? "User"}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs italic text-gray-400">
                    No users assigned
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => router.push(`tasks/${project.id}`)}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
                  aria-label="View Tasks"
                >
                  <ClipboardList size={16} />
                  Tasks
                </button>
                <button
                  onClick={() => openDrawerForEdit(project)}
                  className="inline-flex items-center gap-1 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-yellow-500"
                  aria-label="Edit Project"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setProjectToDelete(project.id);
                    setDeleteDialogOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  aria-label="Delete Project"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <NoDataFound />
      )}

      {/* Confirm Delete Dialog */}
      {deleteDialogOpen && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title="Confirm Delete"
          message="Are you sure you want to delete this project?"
          btnText="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* Unified Create/Edit Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-40">
          <div className="flex h-full w-full max-w-md flex-col rounded-l-2xl bg-white p-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban size={22} className="text-blue-600" />
                <h2 className="text-xl font-bold">
                  {isEditMode ? "Edit Project" : "Create Project"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  resetForm();
                }}
                className="rounded-full p-1 hover:bg-gray-100"
                aria-label="Close Drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Project Form */}
            <div className="flex-grow space-y-4 overflow-y-auto">
              {/* Project Name */}
              <div>
                <label
                  htmlFor="project-name"
                  className="block text-sm font-medium text-blue-900"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border border-blue-200 px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter project name"
                  required
                  aria-required="true"
                />
              </div>
              {/* Project Details */}
              <div>
                <label
                  htmlFor="project-details"
                  className="block text-sm font-medium text-blue-900"
                >
                  Details
                </label>
                <ReactQuill
                  id="project-details"
                  theme="snow"
                  value={details}
                  onChange={setDetails}
                  className="mt-1"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      [{ font: [] }],
                      [{ size: [] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ script: "sub" }, { script: "super" }],
                      [{ color: [] }, { background: [] }],
                      [{ align: [] }],
                      ["blockquote", "code-block"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ indent: "-1" }, { indent: "+1" }],
                      ["link", "image", "video"],
                      ["clean"],
                    ],
                  }}
                  formats={[
                    "header",
                    "font",
                    "size",
                    "bold",
                    "italic",
                    "underline",
                    "strike",
                    "script",
                    "color",
                    "background",
                    "align",
                    "blockquote",
                    "code-block",
                    "list",
                    "bullet",
                    "indent",
                    "link",
                    "image",
                    "video",
                  ]}
                  aria-label="Project Details"
                />
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={generateSummary.isPending}
                  className="mt-2 flex items-center justify-center gap-2 rounded bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  aria-busy={generateSummary.isPending}
                  aria-label="Generate AI Summary"
                >
                  <Sparkles
                    className={`h-6 w-6 animate-pulse text-yellow-300 ${
                      generateSummary.isPending ? "opacity-100" : "opacity-80"
                    }`}
                  />
                  {generateSummary.isPending
                    ? "Generating AI Summary..."
                    : "Generate AI Summary"}
                </button>
                {summary && (
                  <div className="mt-3 rounded border border-gray-300 bg-gray-50 p-3 text-gray-800">
                    <strong>Summary:</strong>
                    <p>{summary}</p>
                  </div>
                )}
              </div>
              {/* Assign Users */}
              <div>
                <label
                  htmlFor="assign-users"
                  className="mb-1 block text-sm font-medium text-blue-900"
                >
                  Assign Users
                </label>
                <div className="mb-2 flex flex-wrap gap-2" id="assign-users">
                  {selectedUserIds.map((id) => {
                    const user = users.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        <UserIcon size={14} />
                        {user.name}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserIds((prev) =>
                              prev.filter((uid) => uid !== id),
                            )
                          }
                          className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
                          aria-label={`Remove ${user.name}`}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <div className="max-h-48 overflow-y-auto rounded border border-blue-100 bg-blue-50 p-2">
                  <ul className="space-y-1">
                    {users.map((user) => {
                      const isSelected = selectedUserIds.includes(user.id);
                      return (
                        <li
                          key={user.id}
                          className={`flex items-center gap-2 rounded px-2 py-1 transition-colors ${
                            isSelected
                              ? "bg-blue-100 font-semibold text-blue-900"
                              : "hover:bg-blue-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedUserIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== user.id)
                                  : [...prev, user.id],
                              );
                            }}
                            id={`user-checkbox-${user.id}`}
                            className="accent-blue-600"
                          />
                          <label
                            htmlFor={`user-checkbox-${user.id}`}
                            className="flex w-full cursor-pointer items-center gap-2"
                          >
                            <UserIcon size={16} />
                            <span>{user.name}</span>
                            <span className="text-xs text-gray-500">
                              ({user.email})
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            {/* Submit Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={createProject.isPending || editProject.isPending}
                className="w-full rounded-lg bg-blue-600 py-2 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                aria-busy={createProject.isPending || editProject.isPending}
              >
                {createProject.isPending || editProject.isPending
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Project"
                    : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
