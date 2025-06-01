import { Loader2 } from "lucide-react";

/**
 * Loading component displays a centered spinner overlay.
 * Used to indicate loading or pending states in the UI.
 * Ensures accessibility with appropriate ARIA attributes.
 */
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80"
      aria-label="Loading"
      role="status"
      tabIndex={-1}
    >
      <Loader2
        className="h-10 w-10 animate-spin text-gray-600"
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
