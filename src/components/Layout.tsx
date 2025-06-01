import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

/**
 * LayoutProps defines the props for the Layout component.
 * Move to a shared types file if reused elsewhere.
 */
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component provides the main app shell with a collapsible sidebar and content area.
 * Handles sidebar toggle, accessibility, and responsive structure.
 */
export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  /**
   * Toggles the sidebar open/closed state.
   */
  const handleSidebarToggle = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-gray-800 text-white transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-16"
        }`}
        aria-label="Main Sidebar"
      >
        {/* Sidebar Header with toggle button and app name */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSidebarToggle}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="rounded p-1 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="button"
            >
              <Menu size={24} aria-hidden="true" />
            </button>
            {/* {isSidebarOpen && (
              <span
                className="text-lg font-semibold tracking-wide"
                tabIndex={0}
              >
                Task Manager App
              </span>
            )} */}
          </div>
        </div>

        {/* Sidebar content fills remaining height */}
        <div className="min-h-0 flex-1">{isSidebarOpen && <Sidebar />}</div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-auto bg-gray-100 p-6"
        aria-label="Main Content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
