import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Headphones, Music, Trash2, Youtube } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vibechain_music_embeds";

function getYouTubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "music.youtube.com"
    ) {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }
    // shorts
    const shortsMatch = u.pathname.match(/\/shorts\/([\w-]+)/);
    if (shortsMatch) return shortsMatch[1];
    return null;
  } catch {
    return null;
  }
}

interface EmbedEntry {
  id: string;
  url: string;
  videoId: string;
}

function loadEmbeds(): EmbedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmbedEntry[];
  } catch {
    return [];
  }
}

function saveEmbeds(embeds: EmbedEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(embeds));
  } catch {
    // storage full or unavailable
  }
}

export default function MusicPage() {
  const [url, setUrl] = useState("");
  const [embeds, setEmbeds] = useState<EmbedEntry[]>(loadEmbeds);
  const [error, setError] = useState("");

  // Persist whenever embeds change
  useEffect(() => {
    saveEmbeds(embeds);
  }, [embeds]);

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const videoId = getYouTubeEmbedId(trimmed);
    if (!videoId) {
      setError("Paste a valid YouTube or YouTube Music link.");
      return;
    }
    setError("");
    setEmbeds((prev) => [
      { id: crypto.randomUUID(), url: trimmed, videoId },
      ...prev,
    ]);
    setUrl("");
  };

  const handleRemove = (id: string) => {
    setEmbeds((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold gradient-text flex items-center gap-3">
          <Headphones className="w-8 h-8" />
          Music
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste a YouTube or YouTube Music link to embed it. Your playlist is
          saved automatically.
        </p>
      </motion.div>

      {/* Input row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-2"
      >
        <div className="relative flex-1">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="https://youtube.com/watch?v=..."
            className="pl-9 glass-card border-border/50 focus:border-primary/50 rounded-xl h-11 text-sm"
            data-ocid="music.input"
          />
        </div>
        <Button
          onClick={handleAdd}
          className="aurora-bg text-white border-0 rounded-xl h-11 px-5 shrink-0"
          data-ocid="music.primary_button"
        >
          Add
        </Button>
      </motion.div>

      {error && (
        <p
          className="text-destructive text-xs mb-4 pl-1"
          data-ocid="music.error_state"
        >
          {error}
        </p>
      )}

      {/* Embeds list */}
      {embeds.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.3 } }}
          className="text-center py-20"
          data-ocid="music.empty_state"
        >
          <Music className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground">No music yet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Paste a YouTube link above to get started.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4 mt-6">
          <AnimatePresence mode="popLayout">
            {embeds.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="glass-card rounded-2xl overflow-hidden"
                data-ocid={`music.item.${i + 1}`}
              >
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${entry.videoId}`}
                    title={`YouTube video ${i + 1}`}
                    width="100%"
                    height="100%"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.url}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(entry.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive h-7 w-7"
                    data-ocid={`music.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
