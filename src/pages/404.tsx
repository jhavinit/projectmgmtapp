import Link from "next/link";

export default function Custom404() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">
        404 - Page Not Found
      </h1>
      <p className="mb-6 text-gray-700">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Go back home
      </Link>
    </div>
  );
}
