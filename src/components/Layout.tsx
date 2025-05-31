import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`flex flex-col bg-gray-800 text-white transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            {isSidebarOpen && (
              <span className="text-lg font-semibold tracking-wide">
                Task Manager App
              </span>
            )}
          </div>
        </div>

        {/* Sidebar content fills remaining height */}
        <div className="min-h-0 flex-1">{isSidebarOpen && <Sidebar />}</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-6">{children}</div>
    </div>
  );
}
