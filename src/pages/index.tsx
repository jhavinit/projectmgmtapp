import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Loading from "~/components/Loading";

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

  return <Loading />;
}
