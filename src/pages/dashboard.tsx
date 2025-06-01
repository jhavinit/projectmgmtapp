import KanbanBoard from "~/components/KanbanBoard";

/**
 * DashboardPage is the main dashboard for authenticated users.
 * Displays the Kanban board for task management.
 */
export default function DashboardPage() {
  return (
    <main className="flex w-full flex-col p-4" aria-label="Dashboard Page">
      {/* KanbanBoard component visualizes tasks in columns */}
      <KanbanBoard />
    </main>
  );
}
