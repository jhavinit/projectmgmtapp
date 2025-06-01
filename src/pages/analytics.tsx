import AnalyticsPanel from "~/components/AnalyticsPanel";

/**
 * AnalyticsPage displays analytics and statistics for the project management app.
 * This page is intended to provide insights into users, projects, and tasks.
 */
export default function AnalyticsPage() {
  return (
    <main className="flex w-full flex-col p-4" aria-label="Analytics Page">
      {/* AnalyticsPanel component visualizes analytics and stats */}
      <AnalyticsPanel />
    </main>
  );
}
