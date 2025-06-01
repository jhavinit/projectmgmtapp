import Link from "next/link";

/**
 * Custom404 is the error page for 404 - Not Found.
 * Provides a user-friendly message and a link to return home.
 */
export default function Custom404() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6"
      aria-label="404 Page Not Found"
    >
      <h1 className="mb-4 text-4xl font-bold text-gray-900" tabIndex={0}>
        404 - Page Not Found
      </h1>
      <p className="mb-6 text-gray-700" tabIndex={0}>
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Go back home"
      >
        Go back home
      </Link>
    </main>
  );
}
