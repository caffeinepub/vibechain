import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { CircleView } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllCircles,
  useCreateCircle,
  useJoinCircle,
  useLeaveCircle,
} from "../hooks/useQueries";

const CIRCLE_GRADIENTS = [
  "from-vibe-violet/20 to-vibe-teal/20",
  "from-vibe-teal/20 to-vibe-amber/20",
  "from-vibe-rose/20 to-vibe-violet/20",
  "from-vibe-amber/20 to-vibe-rose/20",
];

const SKELETON_KEYS = ["csk-a", "csk-b", "csk-c", "csk-d", "csk-e", "csk-f"];

export default function VibeCirclesPage() {
  const { identity } = useInternetIdentity();
  const { data: circles, isLoading, isError } = useAllCircles();
  const { mutateAsync: joinCircle, isPending: isJoining } = useJoinCircle();
  const { mutateAsync: leaveCircle, isPending: isLeaving } = useLeaveCircle();
  const { mutateAsync: createCircle, isPending: isCreating } =
    useCreateCircle();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [actionCircle, setActionCircle] = useState<string | null>(null);

  const myPrincipal = identity?.getPrincipal().toString();

  function isMember(circle: CircleView): boolean {
    if (!myPrincipal) return false;
    return circle.members.some((m) => m.toString() === myPrincipal);
  }

  async function handleJoinLeave(name: string, member: boolean) {
    setActionCircle(name);
    try {
      if (member) {
        await leaveCircle(name);
        toast.success(`Left ${name}`);
      } else {
        await joinCircle(name);
        toast.success(`Joined ${name}! Welcome to the circle.`);
      }
    } catch {
      toast.error("Couldn't update circle membership.");
    } finally {
      setActionCircle(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCircle({ name: newName.trim(), description: newDesc.trim() });
      toast.success(`Circle "${newName}" created! ✨`);
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
    } catch {
      toast.error("Couldn't create the circle.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text-teal">
            Vibe Circles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Join circles built for feelings. Heal together.
          </p>
        </div>

        {identity && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="aurora-bg text-white border-0 gap-2"
                data-ocid="circles.open_modal_button"
              >
                <Plus className="w-4 h-4" /> New Circle
              </Button>
            </DialogTrigger>
            <DialogContent
              className="glass-card border-border/50 sm:max-w-md"
              data-ocid="circles.dialog"
            >
              <DialogHeader>
                <DialogTitle className="gradient-text font-display text-xl">
                  Create a Vibe Circle
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="circleName">Circle Name *</Label>
                  <Input
                    id="circleName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Night Owls"
                    required
                    className="bg-muted/30 border-border/50"
                    data-ocid="circles.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="circleDesc">Description</Label>
                  <Textarea
                    id="circleDesc"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What kind of vibes live here?"
                    rows={3}
                    className="bg-muted/30 border-border/50 resize-none"
                    data-ocid="circles.textarea"
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateOpen(false)}
                    data-ocid="circles.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="aurora-bg text-white border-0"
                    data-ocid="circles.confirm_button"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Creating...
                      </>
                    ) : (
                      "Create Circle"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          data-ocid="circles.loading_state"
        >
          {SKELETON_KEYS.map((k) => (
            <div key={k} className="glass-card rounded-2xl p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16" data-ocid="circles.error_state">
          <p className="text-muted-foreground">
            Couldn't load circles. Try again later.
          </p>
        </div>
      )}

      {!isLoading && !isError && circles?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
          data-ocid="circles.empty_state"
        >
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">No circles yet.</p>
          {identity && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="aurora-bg text-white border-0 mt-4"
              data-ocid="circles.primary_button"
            >
              Create the First Circle
            </Button>
          )}
        </motion.div>
      )}

      {!isLoading && !isError && circles && circles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {circles.map(([name, circle], i) => {
              const member = isMember(circle);
              const loading = actionCircle === name && (isJoining || isLeaving);
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${CIRCLE_GRADIENTS[i % CIRCLE_GRADIENTS.length]} hover:border-primary/30 transition-colors`}
                  data-ocid={`circles.item.${i + 1}`}
                >
                  <div className="w-12 h-12 rounded-full aurora-bg opacity-80 mb-4 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {circle.description || "A space to feel and be felt."}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {circle.members.length} member
                      {circle.members.length !== 1 ? "s" : ""}
                    </span>
                    {identity ? (
                      <Button
                        size="sm"
                        variant={member ? "outline" : "default"}
                        onClick={() => handleJoinLeave(name, member)}
                        disabled={loading}
                        className={
                          member
                            ? "border-border/50 text-muted-foreground"
                            : "aurora-bg text-white border-0"
                        }
                        data-ocid={`circles.toggle.${i + 1}`}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : member ? (
                          "Leave"
                        ) : (
                          "Join"
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        Login to join
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
