import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
      <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
    </div>
  );
}
