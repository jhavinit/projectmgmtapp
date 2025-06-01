import Link from "next/link";
import { Folder, LogOut, LayoutDashboard, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Sidebar() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: session } = useSession(); // Get user session

  const handleLogout = () => {
    setConfirmOpen(true);
  };

  const confirmLogout = () => {
    setConfirmOpen(false);
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <nav className="flex h-full flex-col justify-between overflow-auto bg-gray-900 p-4 text-white">
        <ul className="space-y-2">
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded px-3 py-2 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              href="/projects"
              className="flex items-center gap-2 rounded px-3 py-2 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
            >
              <Folder size={18} />
              <span>Projects</span>
            </Link>
          </li>
        </ul>

        <div className="mt-4 space-y-4 border-t border-gray-700">
          {/* User Info */}
          <div className="ml-2 flex items-center gap-3 pt-4 text-gray-300">
            <User size={20} className="flex-shrink-0" />
            <span className="truncate">{session?.user?.name ?? "User"}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left transition-colors duration-200 hover:bg-red-700 focus:bg-red-700 focus:outline-none"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Logout Confirmation"
        message="Are you sure you want to log out?"
        btnText="Logout"
        onConfirm={confirmLogout}
        onCancel={() => {
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
