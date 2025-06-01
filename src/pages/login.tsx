import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { Card } from "../components/Card";
import toast from "react-hot-toast";
import Link from "next/link";

/**
 * Props for the Input component.
 * Move to a shared types/components file if reused elsewhere.
 */
export interface InputProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}

/**
 * Accessible and reusable input component.
 * Forwards all native input props and ensures proper labeling.
 */
export function Input({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required,
  className,
  autoComplete,
}: InputProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-label={label}
        className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}

/**
 * LoginPage component for user authentication.
 * Handles form state, validation, and login logic.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { data: session, status } = useSession();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === "loading") return;
    if (session) {
      void router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading" || session) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Checking session...
      </div>
    );
  }

  /**
   * Handles login form submission.
   * Performs client-side validation before calling signIn.
   * @param e - Form event
   */
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      toast.success("Login successful!");
      await router.push("/dashboard");
    } else {
      toast.error("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Decorative background, similar to other pages */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/boxes.svg')] bg-cover bg-center opacity-10" />
      <div className="z-10 w-full max-w-md px-4 py-8">
        <Card className="border border-blue-100 shadow-lg">
          <h2 className="mb-6 text-center text-3xl font-extrabold text-blue-700">
            Sign in to your account
          </h2>
          <form
            onSubmit={handleLogin}
            className="space-y-5"
            aria-label="Login form"
          >
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
              autoComplete="current-password"
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
                "Login"
              )}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:underline"
            >
              Register
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
