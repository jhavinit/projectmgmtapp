/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { api } from "~/utils/api";
import { useRouter } from "next/router"; // Add this at the top
import { useState, useMemo } from "react";
import { Plus, X, Edit2, Trash2, FilePlus2, ClipboardList } from "lucide-react";
import { useSession } from "next-auth/react";
import type { Project, User, ProjectAssignment } from "@prisma/client";
import ConfirmDialog from "~/components/ConfirmDialog";
import toast from "react-hot-toast";
import NoDataFound from "~/components/NoDataFound";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import DOMPurify from "dompurify";
import Loading from "~/components/Loading";
import { Sparkles } from "lucide-react"; // or use emoji/icon of your choice

export default function ProjectsPage() {
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    [],
  );
  const [summary, setSummary] = useState<string | null>(null);
  const generateSummary = api.project.generateSummary.useMutation();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { data: users = [] } = api.user.getAll.useQuery();

  const router = useRouter();

  const { data: session } = useSession();
  const utils = api.useContext();
  const { data: projects, isLoading } = api.project.getAll.useQuery();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDetails("");
    setProjectId(null);
    setIsEditMode(false);
    setSummary(null);
    setSelectedUserIds([]);
  };

  const openDrawerForCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const handleGenerateSummary = async () => {
    if (!details.trim()) {
      toast.error("Please enter project details to summarize.");
      return;
    }

    try {
      const result = await generateSummary.mutateAsync({ summary: details });
      setSummary(result); // adjust this based on your actual returned data
      toast.success("Summary generated");
    } catch (error) {
      toast.error("Failed to generate summary");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  type ProjectWithAssignments = Project & {
    projectAssignments: Pick<ProjectAssignment, "userId">[];
  };

  const openDrawerForEdit = (project: ProjectWithAssignments) => {
    setName(project.name);
    setDetails(project.details);
    setProjectId(project.id);
    setSummary(project.summary);
    setIsEditMode(true);
    setDrawerOpen(true);
    setSelectedUserIds(
      project.projectAssignments.map(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        (assignment: Pick<ProjectAssignment, "userId">) => assignment.userId,
      ),
    );
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject.mutate({ id: projectToDelete });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

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

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          onClick={openDrawerForCreate}
          className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Project
        </button>
      </div>

      {isLoading ? (
        <Loading />
      ) : projects && projects.length > 0 ? (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="relative flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <FilePlus2 size={20} />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <h4 className="mb-1 font-medium text-gray-600">Details</h4>
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

              {/* Summary */}
              <div className="mt-3 rounded border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm">
                <h4 className="mb-1 font-medium text-indigo-600">AI Summary</h4>
                {project.summary ? (
                  <p className="text-indigo-700">{project.summary}</p>
                ) : (
                  <div className="flex items-center gap-2 text-xs italic text-indigo-400">
                    <FilePlus2 size={12} />
                    <span>No summary available.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => router.push(`tasks/${project.id}`)}
                  className="inline-flex items-center gap-1 rounded bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
                >
                  <ClipboardList size={16} />
                  Tasks
                </button>
                <button
                  onClick={() => openDrawerForEdit(project)}
                  className="inline-flex items-center gap-1 rounded bg-yellow-400 px-3 py-1.5 text-sm text-gray-800 hover:bg-yellow-500"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setProjectToDelete(project.id);
                    setDeleteDialogOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
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
          <div className="flex h-full w-full max-w-md flex-col bg-white p-6 shadow-lg">
            {/* Header */}
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl font-semibold">
                {isEditMode ? "Edit Project" : "Create Project"}
              </h2>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-grow space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium">
                  Project Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Enter project name"
                />
              </div>
              {/* 
              <div>
                <label className="block text-sm font-medium">Details</label>
                <ReactQuill
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
                      ["clean"], // remove formatting
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
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium">Details</label>
                <ReactQuill
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
                      ["clean"], // remove formatting
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
                />
                {/* <button
                  onClick={handleGenerateSummary}
                  disabled={generateSummary.isPending}
                  className="mt-2 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generateSummary.isPending
                    ? "Generating..."
                    : "Generate Summary"}
                </button> */}

                <button
                  onClick={handleGenerateSummary}
                  disabled={generateSummary.isPending}
                  className="mt-2 flex items-center justify-center gap-2 rounded bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <span className="relative flex items-center gap-1">
                    {/* Sparkle animation */}
                    <Sparkles
                      className={`h-6 w-6 animate-pulse text-yellow-300 ${
                        generateSummary.isPending ? "opacity-100" : "opacity-80"
                      }`}
                    />
                    {generateSummary.isPending
                      ? "Generating AI Summary..."
                      : "Generate AI Summary"}
                  </span>
                </button>

                {summary && (
                  <div className="mt-3 rounded border border-gray-300 bg-gray-50 p-3 text-gray-800">
                    <strong>Summary:</strong>
                    <p>{summary}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Assign Users
                </label>

                {/* Selected Chips */}
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedUserIds.map((id) => {
                    const user = users.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {user.name}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUserIds((prev) =>
                              prev.filter((uid) => uid !== id),
                            )
                          }
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* User List */}
                <div className="max-h-48 overflow-y-auto rounded border p-2">
                  {users.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedUserIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id],
                          );
                        }}
                        className={`cursor-pointer rounded px-2 py-1 hover:bg-gray-100 ${
                          isSelected
                            ? "bg-blue-50 font-medium text-blue-700"
                            : ""
                        }`}
                      >
                        {user.name}{" "}
                        <span className="text-xs text-gray-500">
                          ({user.email})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4">
              <button
                onClick={handleFormSubmit}
                disabled={createProject.isPending || editProject.isPending}
                className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
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
