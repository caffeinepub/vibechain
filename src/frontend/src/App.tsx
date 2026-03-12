import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2, Music2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import MiniPlayerBar from "./components/MiniPlayerBar";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { MiniPlayerProvider, useMiniPlayer } from "./context/MiniPlayerContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPage from "./pages/AdminPage";
import FeedPage from "./pages/FeedPage";
import LandingPage from "./pages/LandingPage";
import MusicPage from "./pages/MusicPage";
import PostVibePage from "./pages/PostVibePage";
import ProfilePage from "./pages/ProfilePage";
import VibeCirclesPage from "./pages/VibeCirclesPage";
import VibeListen from "./pages/VibeListen";

function RootLayout() {
  const { playingVideoId } = useMiniPlayer();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1${playingVideoId ? " pb-20" : ""}`}>
        <Outlet />
      </main>
      <Footer />
      <MiniPlayerBar />
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "glass-card border-border",
            title: "text-foreground",
          },
        }}
      />
    </div>
  );
}

/** Wraps any page — redirects to the login prompt if not authenticated */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { identity, login, isLoggingIn } = useInternetIdentity();

  if (!identity) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-3xl p-10 max-w-sm w-full text-center"
          style={{
            border: "1px solid oklch(0.62 0.26 296 / 0.3)",
            boxShadow:
              "0 0 60px oklch(0.62 0.26 296 / 0.15), 0 0 120px oklch(0.55 0.28 240 / 0.08)",
          }}
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-16 h-16 rounded-2xl aurora-bg flex items-center justify-center mx-auto mb-5 shadow-glow"
          >
            <Music2 className="w-8 h-8 text-white" />
          </motion.div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-vibe-amber animate-pulse-slow" />
            <span className="text-xs text-muted-foreground tracking-widest uppercase">
              Members only
            </span>
            <Sparkles className="w-4 h-4 text-vibe-amber animate-pulse-slow" />
          </div>

          <h2 className="text-2xl font-display font-bold gradient-text mb-3">
            Login to Vibe
          </h2>
          <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
            This page is only visible after login. Join VIBECHAIN to access all
            features.
          </p>

          <button
            type="button"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="protected.login_button"
            className="w-full aurora-bg text-white border-0 font-semibold py-3 rounded-2xl shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Join the Vibe ✶</>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

function HomeRoute() {
  const { identity } = useInternetIdentity();
  if (identity) return <FeedPage />;
  return <LandingPage />;
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeRoute,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: () => (
    <ProtectedRoute>
      <FeedPage />
    </ProtectedRoute>
  ),
});

const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post",
  component: () => (
    <ProtectedRoute>
      <PostVibePage />
    </ProtectedRoute>
  ),
});

const circlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/circles",
  component: () => (
    <ProtectedRoute>
      <VibeCirclesPage />
    </ProtectedRoute>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

const musicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/music",
  component: () => (
    <ProtectedRoute>
      <MusicPage />
    </ProtectedRoute>
  ),
});

const vibeListenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vibe-listen",
  component: () => (
    <ProtectedRoute>
      <VibeListen />
    </ProtectedRoute>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  ),
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => (
    <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
      <p className="text-6xl gradient-text font-display">404</p>
      <p className="text-muted-foreground">This vibe doesn't exist.</p>
      <Link to="/" className="text-primary hover:underline">
        Go home
      </Link>
    </div>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  feedRoute,
  postRoute,
  circlesRoute,
  profileRoute,
  musicRoute,
  vibeListenRoute,
  adminRoute,
  notFoundRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <MiniPlayerProvider>
      <RouterProvider router={router} />
    </MiniPlayerProvider>
  );
}
