import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import Link from "next/link";
import { api } from "~/utils/api";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = api.user.register.useMutation({
    onSuccess: async () => {
      toast.success("Registered successfully!");
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.ok) {
        await router.push("/");
      } else {
        toast.error("Registered, but login failed.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
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

    register.mutate({ name, email, password });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-gray-100 to-blue-200">
      <div className="absolute inset-0 z-0 bg-[url('/boxes.svg')] bg-cover bg-center opacity-10" />

      <div className="z-10 w-full max-w-md px-6">
        <Card>
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
            Create an account
          </h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
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
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" text="Register" />
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
