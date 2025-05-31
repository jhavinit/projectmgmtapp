import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session, status } = useSession();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-gray-100 to-blue-200">
      <div className="absolute inset-0 z-0 bg-[url('/boxes.svg')] bg-cover bg-center opacity-10" />
      <div className="z-10 w-full max-w-md px-6">
        <Card>
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
            Welcome back
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50`}
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
          <p className="mt-4 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
