import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-4 flex items-center text-sm text-gray-700 hover:text-black"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </button>
  );
};
