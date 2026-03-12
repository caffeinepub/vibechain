import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPage from "./pages/AdminPage";
import FeedPage from "./pages/FeedPage";
import LandingPage from "./pages/LandingPage";
import MusicPage from "./pages/MusicPage";
import PostVibePage from "./pages/PostVibePage";
import ProfilePage from "./pages/ProfilePage";
import VibeCirclesPage from "./pages/VibeCirclesPage";

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
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
  component: FeedPage,
});

const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post",
  component: PostVibePage,
});

const circlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/circles",
  component: VibeCirclesPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const musicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/music",
  component: MusicPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
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
  return <RouterProvider router={router} />;
}
