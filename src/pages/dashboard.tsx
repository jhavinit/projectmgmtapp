import { useState } from "react";
// import ProjectList from "../components/projects/ProjectList";
// import ProjectForm from "../components/projects/ProjectForm";

export default function DashboardPage() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="flex w-full flex-col p-4">
      <div className="mb-4">
        hihihi
        {/* <ProjectForm
            selectedProject={selectedProject}
            onClear={() => setSelectedProject(null)}
          /> */}
      </div>
      {/* <ProjectList onSelectProject={setSelectedProject} /> */}
    </div>
  );
}
