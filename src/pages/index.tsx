import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function IndexPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // wait for session
    if (session) {
      void router.replace("/dashboard");
    } else {
      void router.replace("/login");
    }
  }, [session, status, router]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "1.25rem",
        fontWeight: "500",
        color: "#555",
      }}
    >
      Loading...
    </div>
  );
}
