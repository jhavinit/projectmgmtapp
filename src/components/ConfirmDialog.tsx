import { ReactNode } from "react";
import { XCircle, LogOut } from "lucide-react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  btnText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title = "Confirm Logout",
  message,
  btnText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-fade-in-up w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <XCircle className="h-6 w-6 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <p className="mb-6 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            {/* <LogOut className="h-4 w-4" /> */}
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
}
