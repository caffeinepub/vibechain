import { Button } from "@/components/ui/button";
import { Clock, Music, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { Vibe } from "../backend.d";
import { parseVibeMessage, spotifyEmbedUrl } from "../utils/music";

const MOOD_CLASSES: Record<string, string> = {
  Happy: "mood-happy",
  Sad: "mood-sad",
  Anxious: "mood-anxious",
  Peaceful: "mood-peaceful",
  Energetic: "mood-energetic",
  Melancholic: "mood-melancholic",
  Excited: "mood-excited",
  Lonely: "mood-lonely",
  Grateful: "mood-grateful",
  Angry: "mood-angry",
};

const MOOD_EMOJIS: Record<string, string> = {
  Happy: "☀️",
  Sad: "🌧️",
  Anxious: "⚡",
  Peaceful: "🌿",
  Energetic: "🔥",
  Melancholic: "🌙",
  Excited: "✨",
  Lonely: "🌌",
  Grateful: "🌸",
  Angry: "🌋",
};

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

function shortPrincipal(p: { toString: () => string }): string {
  const s = p.toString();
  return s.length > 12 ? `${s.slice(0, 5)}...${s.slice(-4)}` : s;
}

interface VibeCardProps {
  vibe: Vibe;
  index: number;
  canDelete?: boolean;
  onDelete?: (id: bigint) => void;
  isDeleting?: boolean;
}

export default function VibeCard({
  vibe,
  index,
  canDelete,
  onDelete,
  isDeleting,
}: VibeCardProps) {
  const moodClass = MOOD_CLASSES[vibe.mood] || "mood-peaceful";
  const emoji = MOOD_EMOJIS[vibe.mood] || "🎵";

  const rawMessage = Array.isArray(vibe.message)
    ? vibe.message[0]
    : vibe.message;
  const { music, text: messageText } = parseVibeMessage(
    rawMessage as string | null | undefined,
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`glass-card rounded-2xl p-5 ${moodClass} mood-glow relative overflow-hidden`}
      data-ocid={`feed.item.${index + 1}`}
    >
      {/* Mood halo background */}
      <div
        className="absolute inset-0 rounded-2xl opacity-5 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, var(--mood-color), transparent 70%)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="mood-badge text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>{emoji}</span>
              {vibe.mood}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatTime(vibe.timestamp)}
            </span>
            {canDelete && onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(vibe.id)}
                disabled={isDeleting}
                data-ocid={`profile.delete_button.${index + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Song */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "var(--mood-bg)",
              border:
                "1px solid color-mix(in oklch, var(--mood-color) 30%, transparent)",
            }}
          >
            <Music className="w-5 h-5" style={{ color: "var(--mood-color)" }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {vibe.songTitle}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {vibe.artistName}
            </p>
          </div>
        </div>

        {/* YouTube embed */}
        {music?.kind === "youtube" && (
          <div
            className="w-full rounded-xl overflow-hidden mb-3"
            style={{
              border:
                "1px solid color-mix(in oklch, var(--mood-color) 35%, transparent)",
              aspectRatio: "16 / 9",
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${music.videoId}`}
              title={`${vibe.songTitle} – ${vibe.artistName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              style={{ border: "none", display: "block" }}
            />
          </div>
        )}

        {/* Spotify embed */}
        {music?.kind === "spotify" && (
          <div
            className="w-full rounded-xl overflow-hidden mb-3"
            style={{
              border:
                "1px solid color-mix(in oklch, var(--mood-color) 35%, transparent)",
              height: music.ref.type === "track" ? "80px" : "152px",
            }}
          >
            <iframe
              src={spotifyEmbedUrl(music.ref)}
              title={`${vibe.songTitle} – ${vibe.artistName} on Spotify`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full h-full"
              style={{ border: "none", display: "block" }}
            />
          </div>
        )}

        {/* Text message */}
        {messageText && (
          <p className="text-sm text-foreground/80 leading-relaxed mb-3 italic">
            "{messageText}"
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {shortPrincipal(vibe.user)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
