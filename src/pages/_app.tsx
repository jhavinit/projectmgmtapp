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
import Loading from "~/components/Loading";
import { Breadcrumbs } from "~/components/Breadcrumbs";

/**
 * List of routes that do not require authentication.
 */
const PUBLIC_ROUTES = ["/", "/login", "/register", "/404"];

/**
 * AuthGuard component protects private routes.
 * Redirects unauthenticated users to login and shows loading spinner while session is loading.
 */
const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(router.pathname);

  if (status === "loading") return <Loading />;

  if (!session && !isPublic) {
    if (typeof window !== "undefined") void router.push("/login");
    return null;
  }

  return <>{children}</>;
};

/**
 * MyApp is the root component for all pages.
 * Handles session context, route protection, layout, and global UI providers.
 */
const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(router.pathname);

  return (
    <SessionProvider session={session}>
      <AuthGuard>
        <div className={GeistSans.className}>
          <Toaster position="bottom-center" />
          {isPublic ? (
            // Public routes do not use layout or animation
            <Component {...pageProps} />
          ) : (
            // Private routes use layout and page transition animation
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Layout>
                  <Breadcrumbs />
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
