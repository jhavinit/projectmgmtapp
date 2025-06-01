import { XCircle, LogOut, Trash2, CheckCircle2 } from "lucide-react";
import type { FC } from "react";

/**
 * ConfirmDialogProps defines the props for the ConfirmDialog component.
 * Move to a shared types directory if reused elsewhere.
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  btnText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog is a reusable modal dialog for confirming destructive or important actions.
 * Ensures accessibility and visual feedback for different actions.
 */
const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  title = "Are you sure?",
  message,
  btnText = "Confirm",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Choose icon based on action type
  let Icon = CheckCircle2;
  const btnTextLower = btnText.toLowerCase();
  if (btnTextLower.includes("delete")) Icon = Trash2;
  else if (btnTextLower.includes("logout")) Icon = LogOut;
  else if (btnTextLower.includes("remove")) Icon = XCircle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="w-full max-w-md animate-fade-in-up rounded-xl bg-gradient-to-br from-white via-gray-50 to-blue-50 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Icon className="h-6 w-6 text-red-600" aria-hidden="true" />
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-gray-800"
            tabIndex={0}
          >
            {title}
          </h2>
        </div>
        <p
          id="confirm-dialog-message"
          className="mb-6 text-sm text-gray-600"
          tabIndex={0}
        >
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Cancel"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label={btnText}
            type="button"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
