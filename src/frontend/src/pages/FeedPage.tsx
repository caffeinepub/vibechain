import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Waves } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import VibeCard from "../components/VibeCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllVibes } from "../hooks/useQueries";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d"];

export default function FeedPage() {
  const { data: vibes, isLoading, isError } = useAllVibes();
  const { identity } = useInternetIdentity();

  const sorted = vibes
    ? [...vibes].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">
            Vibe Feed
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real moods. Real music. Real people.
          </p>
        </div>
        {identity && (
          <Link to="/post" data-ocid="feed.primary_button">
            <Button className="aurora-bg text-white border-0">
              + Post Vibe
            </Button>
          </Link>
        )}
      </motion.div>

      {isLoading && (
        <div className="space-y-4" data-ocid="feed.loading_state">
          {SKELETON_KEYS.map((k) => (
            <div key={k} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16" data-ocid="feed.error_state">
          <p className="text-destructive text-4xl mb-3">✦</p>
          <p className="text-muted-foreground">
            Couldn't load vibes. The cosmos is resting.
          </p>
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
          data-ocid="feed.empty_state"
        >
          <Waves className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">The feed is quiet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Be the first to share a vibe.
          </p>
          {identity && (
            <Link to="/post" className="mt-6 inline-block">
              <Button className="aurora-bg text-white border-0 mt-4">
                Post First Vibe
              </Button>
            </Link>
          )}
        </motion.div>
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sorted.map((vibe, i) => (
              <VibeCard key={vibe.id.toString()} vibe={vibe} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
