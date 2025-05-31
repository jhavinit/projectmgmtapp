/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { api } from "~/utils/api";
import { useState, useMemo } from "react";
import { Plus, X, Edit2, Trash2, FilePlus2 } from "lucide-react";
import { useSession } from "next-auth/react";
import type { Project } from "@prisma/client";
import ConfirmDialog from "~/components/ConfirmDialog";
import toast from "react-hot-toast";
import NoDataFound from "~/components/NoDataFound";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import DOMPurify from "dompurify";

export default function ProjectsPage() {
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    [],
  );

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
  };

  const openDrawerForCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openDrawerForEdit = (project: Project) => {
    setName(project.name);
    setDetails(project.details);
    setProjectId(project.id);
    setIsEditMode(true);
    setDrawerOpen(true);
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
    if (isEditMode && projectId) {
      editProject.mutate({ id: projectId, name, details });
    } else {
      createProject.mutate({ name, details });
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
        <p>Loading...</p>
      ) : projects && projects.length > 0 ? (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="relative h-64 rounded-lg border border-gray-300 bg-white p-6 shadow-md hover:shadow-xl"
            >
              <div className="absolute left-4 top-4 rounded-full bg-blue-600 p-2 text-white shadow">
                <FilePlus2 className="h-6 w-6" />
              </div>

              <h3 className="mb-2 ml-10 text-xl font-semibold">
                {project.name}
              </h3>

              <div className="mb-6 ml-10 max-h-24 overflow-y-auto pr-2 text-sm text-gray-600">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(project.details),
                  }}
                />
              </div>

              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => openDrawerForEdit(project)}
                  className="flex items-center gap-1 rounded bg-yellow-400 px-3 py-1 text-sm text-gray-800 hover:bg-yellow-500"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setProjectToDelete(project.id);
                    setDeleteDialogOpen(true);
                  }}
                  className="flex items-center gap-1 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
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
                  style={{ height: "200px" }}
                />
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
