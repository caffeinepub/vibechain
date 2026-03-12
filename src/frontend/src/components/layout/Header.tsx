import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import { Headphones, Loader2, LogOut } from "lucide-react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export default function Header() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-full aurora-bg opacity-90 group-hover:opacity-100 transition-opacity" />
          <span className="text-xl font-display font-bold gradient-text tracking-tight">
            VIBECHAIN
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            to="/vibe-listen"
            data-ocid="nav.link"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              currentPath === "/vibe-listen"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Headphones className="w-4 h-4" />
            Vibe Listen
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isInitializing ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : identity ? (
            <Button
              onClick={clear}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive gap-2"
              data-ocid="nav.logout.button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="aurora-bg text-white border-0 font-medium"
              size="sm"
              data-ocid="nav.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Join the Vibe"
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
