import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Headphones,
  Loader2,
  LogOut,
  Music2,
  Plus,
  Shield,
  User,
  Waves,
} from "lucide-react";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export default function Header() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const { data: isAdmin } = useQuery<boolean>({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });

  const navLinks = [
    { to: "/feed", label: "Feed", icon: <Waves className="w-4 h-4" /> },
    { to: "/circles", label: "Circles", icon: <Music2 className="w-4 h-4" /> },
    { to: "/music", label: "Music", icon: <Headphones className="w-4 h-4" /> },
  ];

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
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-ocid="nav.link"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                currentPath === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isInitializing ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : identity ? (
            <>
              <Link to="/post" data-ocid="nav.primary_button">
                <Button
                  size="sm"
                  className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Post Vibe</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-9 h-9 border border-border/50"
                    data-ocid="nav.dropdown_menu"
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="glass-card border-border/50"
                >
                  <DropdownMenuItem asChild>
                    <Link to="/profile" data-ocid="nav.profile.link">
                      <User className="w-4 h-4 mr-2" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" data-ocid="nav.admin.link">
                          <Shield className="w-4 h-4 mr-2 text-primary" />
                          <span className="text-primary font-medium">
                            Admin
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    onClick={clear}
                    className="text-destructive focus:text-destructive"
                    data-ocid="nav.logout.button"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Connecting...
                </>
              ) : (
                "Join the Vibe"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-2">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            data-ocid="nav.link"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              currentPath === link.to
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
