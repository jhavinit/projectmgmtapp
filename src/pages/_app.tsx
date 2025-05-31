import { GeistSans } from "geist/font/sans";
import { type Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { type AppType } from "next/app";
import { Toaster } from "react-hot-toast";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import Layout from "../components/Layout";
import { AnimatePresence, motion } from "framer-motion";

const publicRoutes = ["/", "/login", "/register", "/404"];

const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isPublic = publicRoutes.includes(router.pathname);

  if (status === "loading")
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );

  if (!session && !isPublic) {
    if (typeof window !== "undefined") void router.push("/login");
    return null;
  }

  return <>{children}</>;
};

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const isPublic = publicRoutes.includes(router.pathname);

  return (
    <SessionProvider session={session}>
      <AuthGuard>
        <div className={GeistSans.className}>
          <Toaster position="bottom-center" />
          {isPublic ? (
            <Component {...pageProps} />
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </AuthGuard>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
