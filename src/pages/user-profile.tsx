import { useState } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function UserProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const changePassword = api.user.changePassword.useMutation();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    try {
      await changePassword.mutateAsync({ oldPassword, newPassword });
      toast.success("Password changed successfully!");
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const errorMsg =
        (err as { message?: string })?.message ?? "Failed to change password.";
      toast.error(errorMsg);
      setMessage(errorMsg);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
        <div className="rounded bg-white p-8 shadow-md">
          <span className="text-lg font-semibold text-gray-700">
            Loading user...
          </span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-10">
      <main
        className="mx-auto flex w-full max-w-lg flex-col rounded-xl bg-white/90 p-8 shadow-2xl backdrop-blur"
        aria-label="User Profile Page"
      >
        <h1 className="mb-8 text-center text-4xl font-extrabold text-blue-800 drop-shadow">
          User Profile
        </h1>
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600">Name:</span>
            <span className="text-lg text-gray-800">{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-600">Email:</span>
            <span className="text-lg text-gray-800">{user.email}</span>
          </div>
        </div>
        <button
          className={`mb-8 w-full rounded-lg px-4 py-2 font-semibold shadow transition-colors ${
            showPasswordForm
              ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={() => setShowPasswordForm((v) => !v)}
        >
          {showPasswordForm ? "Cancel" : "Edit Password"}
        </button>
        {showPasswordForm && (
          <form
            onSubmit={handleChangePassword}
            className="flex flex-col gap-5 rounded-lg bg-blue-50/80 p-6 shadow-inner"
          >
            <input
              type="password"
              placeholder="Old Password"
              className="rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New Password"
              className="rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 font-semibold text-white shadow transition-colors hover:bg-green-700"
            >
              Change Password
            </button>
            {message && (
              <div
                className={`mt-2 text-center text-sm ${
                  message.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
