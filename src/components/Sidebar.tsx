import Link from "next/link";
import {
  ChartLine,
  Folder,
  LogOut,
  LayoutDashboard,
  User,
  CheckCircle,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useRouter } from "next/router";

/**
 * Sidebar component for main navigation.
 * Displays navigation links, user info, and logout functionality.
 */
export default function Sidebar() {
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const { data: session } = useSession();
  const router = useRouter();

  /**
   * Opens the logout confirmation dialog.
   */
  const handleLogout = () => setConfirmOpen(true);

  /**
   * Confirms logout and signs the user out.
   */
  const confirmLogout = () => {
    setConfirmOpen(false);
    void signOut({ callbackUrl: "/login" });
  };

  /**
   * Helper to highlight the active navigation link.
   * @param href - The route to check.
   * @returns True if the current route matches the href.
   */
  const isActive = (href: string) => router.pathname.startsWith(href);

  return (
    <>
      <nav
        className="flex h-full flex-col justify-between overflow-auto bg-gradient-to-br from-gray-900 via-gray-800 to-blue-950 p-4 text-white shadow-xl"
        aria-label="Sidebar Navigation"
      >
        {/* Logo / App Name */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <LayoutDashboard
            size={28}
            className="text-blue-400"
            aria-hidden="true"
          />
          <span className="text-2xl font-extrabold tracking-tight text-blue-100">
            Task<span className="text-blue-400">Flow</span>
          </span>
        </div>

        {/* Navigation Links */}
        <ul className="flex-1 space-y-2" aria-label="Main Navigation">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-700 text-white shadow"
                  : "hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              }`}
              aria-current={isActive("/dashboard") ? "page" : undefined}
            >
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              href="/projects"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive("/projects")
                  ? "bg-blue-700 text-white shadow"
                  : "hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              }`}
              aria-current={isActive("/projects") ? "page" : undefined}
            >
              <Folder size={18} aria-hidden="true" />
              <span>Projects</span>
            </Link>
          </li>
          <li>
            <Link
              href="/analytics"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive("/analytics")
                  ? "bg-blue-700 text-white shadow"
                  : "hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              }`}
              aria-current={isActive("/analytics") ? "page" : undefined}
            >
              <ChartLine size={18} aria-hidden="true" />
              <span>Analytics</span>
            </Link>
          </li>
          <li>
            <Link
              href="/project-status"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive("/project-status")
                  ? "bg-blue-700 text-white shadow"
                  : "hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              }`}
              aria-current={isActive("/project-status") ? "page" : undefined}
            >
              <CheckCircle size={18} aria-hidden="true" />

              <span>Project Status</span>
            </Link>
          </li>
        </ul>

        {/* User Info and Logout */}
        <div className="mt-4 space-y-4 border-t border-gray-800 pt-4">
          {/* User Info */}
          {/* <div
            className="flex items-center gap-3 rounded-lg bg-blue-900/40 px-3 py-2 text-blue-100"
            aria-label="Current User"
          > */}
          <Link
            href="/user-profile"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
              isActive("/user-profile")
                ? "bg-blue-700 text-white shadow"
                : "hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
            }`}
            aria-current={isActive("/user-profile") ? "page" : undefined}
          >
            <User size={18} aria-hidden="true" />
            <span>{session?.user?.name ?? "User"}</span>
          </Link>
          {/* </div> */}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-red-200 transition-colors duration-200 hover:bg-red-700 hover:text-white focus:bg-red-700 focus:outline-none"
            aria-label="Logout"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Logout Confirmation"
        message="Are you sure you want to log out?"
        btnText="Logout"
        onConfirm={confirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
