import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import {
  Users,
  User,
  BarChart2,
  ListChecks,
  TrendingUp,
  FolderKanban,
  Clock,
  Star,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  PieChart,
  Award,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * Color palettes for status and priority charts.
 */
const STATUS_COLORS = ["#facc15", "#38bdf8", "#4ade80", "#f87171"];
// const PRIORITY_COLORS = ["#22c55e", "#facc15", "#ef4444"];

/**
 * AnalyticsPanel displays various analytics and statistics for the app.
 * Includes user, project, task, time-based, and quality analytics.
 */
export default function AnalyticsPanel() {
  // Data fetching hooks
  const { data: userStats, isLoading: isUserStatsLoading } =
    api.analytics.userStats.useQuery();
  const { data: activeUsers, isLoading: isActiveUsersLoading } =
    api.analytics.activeUsersPerProject.useQuery();
  const { data: projectStats, isLoading: isProjectStatsLoading } =
    api.analytics.projectStats.useQuery();
  const { data: taskStats, isLoading: isTaskStatsLoading } =
    api.analytics.taskStats.useQuery();
  const { data: timeStats, isLoading: isTimeStatsLoading } =
    api.analytics.timeBasedStats.useQuery();
  const { data: qualityStats, isLoading: isQualityStatsLoading } =
    api.analytics.projectQuality.useQuery();

  // Show loader if any analytics data is loading
  const isLoading =
    isUserStatsLoading ||
    isActiveUsersLoading ||
    isProjectStatsLoading ||
    isTaskStatsLoading ||
    isTimeStatsLoading ||
    isQualityStatsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Helper map for projectId -> projectName
  const projectMap =
    projectStats?.projectsWithMostTasks?.reduce(
      (acc: Record<string, string>, p: { id: string; name: string }) => {
        acc[p.id] = p.name;
        return acc;
      },
      {},
    ) ?? {};

  // Pie chart data for status breakdown
  const statusPieData =
    taskStats?.statusBreakdown?.map(
      (s: { status: string; _count: { _all: number } }) => ({
        name: s.status,
        value: s._count._all,
      }),
    ) ?? [];

  // Bar chart data for tasks per month
  const tasksPerMonthData = Array.isArray(timeStats?.tasksPerMonth)
    ? [...timeStats.tasksPerMonth]
        .reverse()
        .map((t: { month: string; count: number }) => ({
          month: new Date(t.month).toLocaleString("default", {
            month: "short",
            year: "2-digit",
          }),
          count: t.count,
        }))
    : [];

  return (
    <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 xl:grid-cols-3">
      {/* User Analytics */}
      <section className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow">
        <div className="flex items-center gap-2 text-blue-700">
          <Users size={22} />
          <h2 className="text-lg font-bold">User Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <User size={18} className="text-blue-500" />
          <span className="font-medium">Total users:</span>
          <span>{userStats?.totalUsers ?? "-"}</span>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-blue-600">
            <Award size={16} /> Top users by tasks
          </div>
          <ul className="ml-2 list-disc text-sm">
            {userStats?.topUsers?.map(
              (u: {
                id: string;
                name: string;
                _count: { tasksAssigned: number };
              }) => (
                <li key={u.id}>
                  {u.name}{" "}
                  <span className="text-gray-500">
                    ({u._count.tasksAssigned})
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-blue-600">
            <FolderKanban size={16} /> Active users per project
          </div>
          <ul className="ml-2 list-disc text-sm">
            {activeUsers?.map(
              (a: { projectId: string; _count: { userId: number } }) => (
                <li key={a.projectId}>
                  {projectMap[a.projectId] ?? a.projectId}:{" "}
                  <span className="text-gray-500">{a._count.userId}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* Project Analytics */}
      <section className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 shadow">
        <div className="flex items-center gap-2 text-green-700">
          <FolderKanban size={22} />
          <h2 className="text-lg font-bold">Project Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-green-500" />
          <span className="font-medium">Total projects:</span>
          <span>{projectStats?.totalProjects ?? "-"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={18} className="text-green-500" />
          <span className="font-medium">Avg users/project:</span>
          <span>{projectStats?.avgUsersPerProject?.toFixed(2) ?? "-"}</span>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-green-600">
            <TrendingUp size={16} /> Projects with most tasks
          </div>
          <ul className="ml-2 list-disc text-sm">
            {projectStats?.projectsWithMostTasks?.map(
              (p: { id: string; name: string; _count: { tasks: number } }) => (
                <li key={p.id}>
                  {p.name}{" "}
                  <span className="text-gray-500">({p._count.tasks})</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* Task Analytics with Pie Chart */}
      <section className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 shadow">
        <div className="flex items-center gap-2 text-yellow-700">
          <ListChecks size={22} />
          <h2 className="text-lg font-bold">Task Analytics</h2>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-yellow-600">
            <PieChart size={16} /> Status breakdown
          </div>
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <ul className="ml-2 list-disc text-sm">
              {taskStats?.statusBreakdown?.map(
                (s: { status: string; _count: { _all: number } }) => (
                  <li key={s.status}>
                    {s.status}:{" "}
                    <span className="text-gray-500">{s._count._all}</span>
                  </li>
                ),
              )}
            </ul>
            {statusPieData.length > 0 && (
              <ResponsiveContainer width={180} height={180}>
                <RePieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {statusPieData.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[idx % STATUS_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ReTooltip />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-yellow-600">
            <Star size={16} /> Priority breakdown
          </div>
          <ul className="ml-2 list-disc text-sm">
            {taskStats?.priorityBreakdown?.map(
              (p: { priority: string; _count: { _all: number } }) => (
                <li key={p.priority}>
                  {p.priority}:{" "}
                  <span className="text-gray-500">{p._count._all}</span>
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-yellow-500" />
          <span className="font-medium">Overdue tasks:</span>
          <span>{taskStats?.overdueTasks ?? "-"}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={18} className="text-yellow-500" />
          <span className="font-medium">Avg tasks/user:</span>
          <span>{taskStats?.avgTasksPerUser?.toFixed(2) ?? "-"}</span>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-yellow-600">
            <ListChecks size={16} /> Type breakdown
          </div>
          <ul className="ml-2 list-disc text-sm">
            {taskStats?.typeBreakdown?.map(
              (t: { type: string; _count: { _all: number } }) => (
                <li key={t.type}>
                  {t.type}:{" "}
                  <span className="text-gray-500">{t._count._all}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* Time-Based Analytics with Bar Chart */}
      <section className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow">
        <div className="flex items-center gap-2 text-purple-700">
          <CalendarDays size={22} />
          <h2 className="text-lg font-bold">Time-Based Analytics</h2>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-purple-600">
            <BarChart2 size={16} /> Tasks per month
          </div>
          <div className="h-48 w-full">
            {tasksPerMonthData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={tasksPerMonthData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Bar dataKey="count" fill="#facc15" />
                  <ReTooltip />
                  <Legend />
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-purple-600">
            <BarChart2 size={16} /> Projects per month
          </div>
          <ul className="ml-2 list-disc text-sm">
            {Array.isArray(timeStats?.projectsPerMonth)
              ? timeStats.projectsPerMonth.map(
                  (p: { month: string; count: number }, i: number) => (
                    <li key={i}>
                      {new Date(p.month).toLocaleString("default", {
                        month: "short",
                        year: "numeric",
                      })}
                      : <span className="text-gray-500">{p.count}</span>
                    </li>
                  ),
                )
              : null}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-purple-500" />
          <span className="font-medium">Avg task completion time (days):</span>
          <span>{timeStats?.avgCompletionTime?.toFixed(2) ?? "-"}</span>
        </div>
      </section>

      {/* Project Quality */}
      <section className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 p-6 shadow">
        <div className="flex items-center gap-2 text-pink-700">
          <CheckCircle2 size={22} />
          <h2 className="text-lg font-bold">Project Quality</h2>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2 font-medium text-pink-600">
            <TrendingUp size={16} /> Avg completion rate per project
          </div>
          <ul className="ml-2 list-disc text-sm">
            {qualityStats?.rates?.map(
              (r: { projectId: string; rate: number }) => (
                <li key={r.projectId}>
                  {projectMap[r.projectId] ?? r.projectId}:{" "}
                  <span className="text-gray-500">
                    {(r.rate * 100).toFixed(1)}%
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Star size={18} className="text-pink-500" />
          <span className="font-medium">Avg priority score:</span>
          <span>{qualityStats?.avgPriority?.toFixed(2) ?? "-"}</span>
        </div>
      </section>
    </div>
  );
}
