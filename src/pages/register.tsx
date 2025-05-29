import { useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const router = useRouter();

  const register = api.user.register.useMutation({
    onSuccess: async () => {
      alert("Registered successfully! You can now sign in.");
      await router.push("/");
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        className="flex w-96 flex-col gap-4 rounded bg-white p-6 shadow-md"
        onSubmit={(e) => {
          e.preventDefault();
          register.mutate(form);
        }}
      >
        <h2 className="text-xl font-bold">Register</h2>
        <input
          type="text"
          placeholder="Name"
          className="border p-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
        >
          Register
        </button>
      </form>
    </div>
  );
}
