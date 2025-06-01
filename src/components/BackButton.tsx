import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * BackButton is a reusable button for navigating to the previous page.
 * Uses Next.js router and ensures accessibility.
 */
export const BackButton: React.FC = () => {
  const router = useRouter();

  /**
   * Handles the back navigation.
   */
  const handleBack = () => router.back();

  return (
    <button
      onClick={handleBack}
      className="mb-4 flex items-center text-sm text-gray-700 transition-colors hover:text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Go back"
      type="button"
    >
      <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
      Back
    </button>
  );
};
