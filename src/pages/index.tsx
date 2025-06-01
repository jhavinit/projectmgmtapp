import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Loading from "~/components/Loading";

/**
 * IndexPage is the root landing page.
 * Redirects authenticated users to the dashboard and unauthenticated users to login.
 * Shows a loading spinner while session status is being determined.
 */
export default function IndexPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for session status to resolve before redirecting
    if (status === "loading") return;
    if (session) {
      // Redirect authenticated users to dashboard
      void router.replace("/dashboard");
    } else {
      // Redirect unauthenticated users to login
      void router.replace("/login");
    }
  }, [session, status, router]);

  // Show loading spinner while redirecting or waiting for session
  return (
    <main aria-label="Redirecting">
      <Loading />
    </main>
  );
}
