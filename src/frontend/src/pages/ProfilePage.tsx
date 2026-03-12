import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import { Check, Edit2, Loader2, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import VibeCard from "../components/VibeCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useDeleteVibe,
  useSaveProfile,
  useUserVibes,
} from "../hooks/useQueries";

const VIBE_SKELETON_KEYS = ["vsk-a", "vsk-b", "vsk-c"];

export default function ProfilePage() {
  const { identity, login } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: vibes, isLoading: vibesLoading } = useUserVibes();
  const { mutateAsync: saveProfile, isPending: isSaving } = useSaveProfile();
  const {
    mutateAsync: deleteVibe,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeleteVibe();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio);
    }
  }, [profile]);

  if (!identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🌌</p>
        <h2 className="text-2xl font-display font-bold mb-3">
          Your Vibe Space
        </h2>
        <p className="text-muted-foreground mb-6">
          Login to see your profile and vibes.
        </p>
        <Button
          onClick={login}
          className="aurora-bg text-white border-0"
          data-ocid="profile.primary_button"
        >
          Join the Vibe
        </Button>
      </div>
    );
  }

  const principal = identity.getPrincipal().toString();
  const shortPrincipal = `${principal.slice(0, 8)}...${principal.slice(-6)}`;

  async function handleSave() {
    try {
      await saveProfile({ username: username.trim(), bio: bio.trim() });
      toast.success("Profile saved! ✨");
      setEditing(false);
    } catch {
      toast.error("Couldn't save profile.");
    }
  }

  async function handleDeleteVibe(id: bigint) {
    try {
      await deleteVibe(id);
      toast.success("Vibe removed.");
    } catch {
      toast.error("Couldn't delete the vibe.");
    }
  }

  const sortedVibes = vibes
    ? [...vibes].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 mb-8"
      >
        {profileLoading ? (
          <div className="space-y-3" data-ocid="profile.loading_state">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full aurora-bg flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  {editing ? (
                    <>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="font-semibold text-lg bg-muted/30 border-border/50 w-48"
                        placeholder="Your display name / user ID"
                        data-ocid="profile.input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This name is shown publicly next to songs you add
                      </p>
                    </>
                  ) : (
                    <h2 className="text-xl font-semibold">
                      {profile?.username || shortPrincipal}
                    </h2>
                  )}
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {shortPrincipal}
                  </p>
                </div>
              </div>

              {!editing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  data-ocid="profile.edit_button"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      if (profile) {
                        setUsername(profile.username);
                        setBio(profile.bio);
                      }
                    }}
                    className="text-muted-foreground"
                    data-ocid="profile.cancel_button"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="aurora-bg text-white border-0"
                    data-ocid="profile.save_button"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {editing ? (
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world how your soul sounds..."
                rows={2}
                className="bg-muted/30 border-border/50 resize-none text-sm"
                data-ocid="profile.textarea"
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                {profile?.bio || "No bio yet. Share how your soul sounds."}
              </p>
            )}
          </div>
        )}
      </motion.div>

      <div>
        <h2 className="text-xl font-display font-bold mb-5 gradient-text">
          My Vibes
        </h2>
        {vibesLoading && (
          <div className="space-y-4" data-ocid="profile.loading_state">
            {VIBE_SKELETON_KEYS.map((k) => (
              <div key={k} className="glass-card rounded-2xl p-5 space-y-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!vibesLoading && sortedVibes.length === 0 && (
          <div className="text-center py-16" data-ocid="profile.empty_state">
            <p className="text-4xl mb-3">🎵</p>
            <p className="text-muted-foreground">No vibes yet.</p>
            <Link to="/post" className="mt-4 inline-block">
              <Button
                className="aurora-bg text-white border-0 mt-3"
                data-ocid="profile.secondary_button"
              >
                Post Your First Vibe
              </Button>
            </Link>
          </div>
        )}
        {!vibesLoading && sortedVibes.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sortedVibes.map((vibe, i) => (
                <VibeCard
                  key={vibe.id.toString()}
                  vibe={vibe}
                  index={i}
                  canDelete
                  onDelete={handleDeleteVibe}
                  isDeleting={isDeleting && deletingId === vibe.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
