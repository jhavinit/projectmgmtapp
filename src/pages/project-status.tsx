import GanttChart from "~/components/GanttChart";

/**
 * ProjectStatusPage displays the Gantt chart for project timelines and status.
 * This page is intended to provide a visual overview of project progress.
 */
export default function ProjectStatusPage() {
  return (
    <main className="flex w-full flex-col p-4" aria-label="Project Status Page">
      {/* GanttChart component visualizes project timelines */}
      <section aria-label="Project Gantt Chart">
        <GanttChart />
      </section>
    </main>
  );
}
