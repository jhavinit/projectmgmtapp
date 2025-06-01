import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Card } from "../components/Card";
import Link from "next/link";
import { api } from "~/utils/api";
import toast from "react-hot-toast";

/**
 * Props for the Input component.
 * Extend React.InputHTMLAttributes to support all native input props.
 * Place this interface in a shared types/components file if reused elsewhere.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

/**
 * Accessible and reusable input component.
 * Forwards all native input props and ensures proper labeling.
 */
export function Input({ label, className, ...props }: InputProps) {
  return (
    <div className={className}>
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        {...props}
        id={props.name}
        aria-label={label}
        className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}

/**
 * RegisterPage component for user registration.
 * Handles form state, validation, and registration logic.
 */
export default function RegisterPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Register mutation using tRPC
  const register = api.user.register.useMutation({
    onSuccess: async () => {
      toast.success("Registered successfully!");
      // Automatically sign in after registration
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.ok) {
        await router.push("/dashboard");
      } else {
        toast.error("Registered, but login failed.");
      }
      setLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
      setLoading(false);
    },
  });

  /**
   * Handles registration form submission.
   * Performs client-side validation before calling the register mutation.
   * @param e - Form event
   */
  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    if (!name.trim()) return toast.error("Name is required");
    if (name.trim().length < 2)
      return toast.error("Name must be at least 2 characters");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return toast.error("Email is required");
    if (!emailRegex.test(email)) return toast.error("Invalid email format");

    if (!password) return toast.error("Password is required");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");

    if (password !== confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);
    register.mutate({ name, email, password });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/boxes.svg')] bg-cover bg-center opacity-10" />
      <div className="z-10 w-full max-w-md px-4 py-8">
        <Card className="border border-blue-100 shadow-lg">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-blue-700">
            Create an account
          </h2>
          <form
            onSubmit={handleRegister}
            className="space-y-5"
            aria-label="Registration form"
          >
            <Input
              label="Name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                "Register"
              )}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/"
              className="font-medium text-blue-600 hover:underline"
            >
              Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
