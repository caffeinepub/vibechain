import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  LayoutDashboard,
  Loader2,
  Music2,
  Shield,
  Trash2,
  Users,
  Waves,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

function truncatePrincipal(p: Principal): string {
  const s = p.toString();
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function formatTime(ts: bigint): string {
  // IC timestamps are in nanoseconds
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleString();
}

export default function AdminPage() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const qc = useQueryClient();

  // Gate check
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery<boolean>({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });

  const { data: allVibes = [], isLoading: vibesLoading } = useQuery({
    queryKey: ["admin", "allVibes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVibes();
    },
    enabled: !!actor && !isFetching && isAdmin === true,
  });

  const { data: allCircles = [], isLoading: circlesLoading } = useQuery({
    queryKey: ["admin", "allCircles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCircles();
    },
    enabled: !!actor && !isFetching && isAdmin === true,
  });

  const deleteVibeMutation = useMutation({
    mutationFn: async (vibeId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteVibe(vibeId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "allVibes"] });
      qc.invalidateQueries({ queryKey: ["vibes"] });
      toast.success("Vibe deleted");
    },
    onError: () => toast.error("Failed to delete vibe"),
  });

  const deleteCircleMutation = useMutation({
    mutationFn: async (circleName: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCircle(circleName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "allCircles"] });
      qc.invalidateQueries({ queryKey: ["circles"] });
      toast.success("Circle deleted");
    },
    onError: () => toast.error("Failed to delete circle"),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => toast.success("Role assigned"),
    onError: () => toast.error("Failed to assign role"),
  });

  // Extract unique principals from vibes
  const uniquePrincipals = Array.from(
    new Map(allVibes.map((v) => [v.user.toString(), v.user])).values(),
  );

  const [userRoles, setUserRoles] = useState<Record<string, UserRole>>({});

  if (!identity) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh] flex-col gap-4"
        data-ocid="admin.error_state"
      >
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-lg text-muted-foreground">
          You must be logged in to access the admin panel.
        </p>
        <Link to="/" className="text-primary hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (checkingAdmin || isFetching) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh] flex-col gap-4"
        data-ocid="admin.error_state"
      >
        <Shield className="w-16 h-16 text-destructive opacity-60" />
        <h2 className="text-2xl font-display font-bold gradient-text">
          Access Denied
        </h2>
        <p className="text-muted-foreground text-center max-w-sm">
          You do not have admin privileges to view this page.
        </p>
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl aurora-bg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage vibes, circles, and users across VIBECHAIN
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass-card border border-border/50 p-1 h-auto gap-1">
          {[
            {
              value: "overview",
              label: "Overview",
              icon: <LayoutDashboard className="w-4 h-4" />,
            },
            {
              value: "vibes",
              label: "Vibes",
              icon: <Waves className="w-4 h-4" />,
            },
            {
              value: "circles",
              label: "Circles",
              icon: <Music2 className="w-4 h-4" />,
            },
            {
              value: "users",
              label: "Users",
              icon: <Users className="w-4 h-4" />,
            },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              data-ocid="admin.tab"
              className="flex items-center gap-2 data-[state=active]:aurora-bg data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-ocid="admin.overview.section"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Waves className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Vibes</p>
                <p className="text-4xl font-display font-bold gradient-text">
                  {vibesLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    allVibes.length
                  )}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <Music2 className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Circles</p>
                <p className="text-4xl font-display font-bold gradient-text-teal">
                  {circlesLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    allCircles.length
                  )}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Unique Users</p>
                <p
                  className="text-4xl font-display font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.17 62), oklch(0.70 0.28 345))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {vibesLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    uniquePrincipals.length
                  )}
                </p>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        {/* Vibes */}
        <TabsContent value="vibes">
          <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg gradient-text">
                All Vibes
              </h2>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                {allVibes.length} total
              </Badge>
            </div>
            {vibesLoading ? (
              <div
                className="flex items-center justify-center p-12"
                data-ocid="admin.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allVibes.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                No vibes yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Mood
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Song
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Artist
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        User
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Posted
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVibes.map((vibe, idx) => (
                      <TableRow
                        key={vibe.id.toString()}
                        className="border-border/30 hover:bg-muted/20"
                      >
                        <TableCell>
                          <span
                            className={`mood-badge px-2 py-0.5 rounded-full text-xs font-medium mood-${vibe.mood.toLowerCase()}`}
                          >
                            {vibe.mood}
                          </span>
                        </TableCell>
                        <TableCell className="text-foreground font-medium max-w-[160px] truncate">
                          {vibe.songTitle}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[120px] truncate">
                          {vibe.artistName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {truncatePrincipal(vibe.user)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatTime(vibe.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`admin.vibes.delete_button.${idx + 1}`}
                            onClick={() => deleteVibeMutation.mutate(vibe.id)}
                            disabled={deleteVibeMutation.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                          >
                            {deleteVibeMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Circles */}
        <TabsContent value="circles">
          <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg gradient-text">
                All Circles
              </h2>
              <Badge
                variant="outline"
                className="border-secondary/30 text-secondary"
              >
                {allCircles.length} total
              </Badge>
            </div>
            {circlesLoading ? (
              <div
                className="flex items-center justify-center p-12"
                data-ocid="admin.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allCircles.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                No circles yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Name
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Description
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Members
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Creator
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCircles.map(([name, circle], idx) => (
                      <TableRow
                        key={name}
                        className="border-border/30 hover:bg-muted/20"
                      >
                        <TableCell className="font-medium text-foreground">
                          {name}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {circle.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border/50">
                            {circle.members.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {truncatePrincipal(circle.creator)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`admin.circles.delete_button.${idx + 1}`}
                            onClick={() => deleteCircleMutation.mutate(name)}
                            disabled={deleteCircleMutation.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                          >
                            {deleteCircleMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg gradient-text">
                User Roles
              </h2>
              <Badge variant="outline" className="border-accent/30 text-accent">
                {uniquePrincipals.length} users
              </Badge>
            </div>
            {vibesLoading ? (
              <div
                className="flex items-center justify-center p-12"
                data-ocid="admin.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : uniquePrincipals.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Principal
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Assign Role
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniquePrincipals.map((principal, idx) => {
                      const key = principal.toString();
                      const selectedRole = userRoles[key] ?? UserRole.user;
                      return (
                        <TableRow
                          key={key}
                          className="border-border/30 hover:bg-muted/20"
                        >
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {truncatePrincipal(principal)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={selectedRole}
                              onValueChange={(val) =>
                                setUserRoles((prev) => ({
                                  ...prev,
                                  [key]: val as UserRole,
                                }))
                              }
                            >
                              <SelectTrigger
                                className="w-32 h-8 glass-card border-border/50 text-sm"
                                data-ocid={`admin.users.select.${idx + 1}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="glass-card border-border/50">
                                <SelectItem value={UserRole.user}>
                                  User
                                </SelectItem>
                                <SelectItem value={UserRole.guest}>
                                  Guest
                                </SelectItem>
                                <SelectItem value={UserRole.admin}>
                                  Admin
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              data-ocid={`admin.users.save_button.${idx + 1}`}
                              onClick={() =>
                                assignRoleMutation.mutate({
                                  user: principal,
                                  role: selectedRole,
                                })
                              }
                              disabled={assignRoleMutation.isPending}
                              className="h-8 px-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs"
                            >
                              {assignRoleMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Assign"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
