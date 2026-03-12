import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Music2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePostVibe } from "../hooks/useQueries";
import { encodeMusicMessage, parseMusicUrl } from "../utils/music";

const MOODS = [
  { name: "Happy", emoji: "☀️", cls: "mood-happy" },
  { name: "Sad", emoji: "🌧️", cls: "mood-sad" },
  { name: "Anxious", emoji: "⚡", cls: "mood-anxious" },
  { name: "Peaceful", emoji: "🌿", cls: "mood-peaceful" },
  { name: "Energetic", emoji: "🔥", cls: "mood-energetic" },
  { name: "Melancholic", emoji: "🌙", cls: "mood-melancholic" },
  { name: "Excited", emoji: "✨", cls: "mood-excited" },
  { name: "Lonely", emoji: "🌌", cls: "mood-lonely" },
  { name: "Grateful", emoji: "🌸", cls: "mood-grateful" },
  { name: "Angry", emoji: "🌋", cls: "mood-angry" },
];

export default function PostVibePage() {
  const { identity, login } = useInternetIdentity();
  const navigate = useNavigate();
  const { mutateAsync: postVibe, isPending } = usePostVibe();

  const [selectedMood, setSelectedMood] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [message, setMessage] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const previewMusic = musicUrl.trim() ? parseMusicUrl(musicUrl.trim()) : null;

  function handleMusicUrlChange(val: string) {
    setMusicUrl(val);
    if (val.trim() === "") {
      setUrlError("");
    } else if (!parseMusicUrl(val.trim())) {
      setUrlError("Paste a valid YouTube URL to embed music.");
    } else {
      setUrlError("");
    }
  }

  if (!identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🌌</p>
        <h2 className="text-2xl font-display font-bold mb-3">
          Login to Post a Vibe
        </h2>
        <p className="text-muted-foreground mb-6">
          Connect your identity to share how you feel.
        </p>
        <Button
          onClick={login}
          className="aurora-bg text-white border-0"
          data-ocid="post.primary_button"
        >
          Join the Vibe
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMood) {
      toast.error("Pick a mood first!");
      return;
    }
    if (!songTitle.trim() || !artistName.trim()) {
      toast.error("Song title and artist are required.");
      return;
    }
    const urlTrimmed = musicUrl.trim();
    let music = urlTrimmed ? parseMusicUrl(urlTrimmed) : null;
    if (urlTrimmed && !music) {
      toast.error("Please enter a valid YouTube URL, or leave it empty.");
      return;
    }
    const encodedMessage = encodeMusicMessage(music, message);
    try {
      await postVibe({
        mood: selectedMood,
        songTitle: songTitle.trim(),
        artistName: artistName.trim(),
        message: encodedMessage || null,
      });
      toast.success("Vibe posted! ✨");
      navigate({ to: "/vibe-listen" });
    } catch {
      toast.error("Couldn't post your vibe. Try again.");
    }
  }

  const selectedMoodData = MOODS.find((m) => m.name === selectedMood);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold gradient-text">
            Post a Vibe
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            What song is carrying your soul right now?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label className="text-base font-semibold mb-4 block">
              How are you feeling?
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.name}
                  type="button"
                  onClick={() => setSelectedMood(mood.name)}
                  className={`${mood.cls} rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all border ${
                    selectedMood === mood.name
                      ? "mood-badge ring-2 ring-offset-1 ring-offset-background scale-105"
                      : "glass-card border-border/50 hover:border-primary/30"
                  }`}
                  data-ocid="post.mood.toggle"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span
                    className="text-xs font-medium"
                    style={
                      selectedMood === mood.name
                        ? { color: "var(--mood-color)" }
                        : {}
                    }
                  >
                    {mood.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div
            className={`glass-card rounded-2xl p-6 space-y-5 transition-all ${
              selectedMoodData ? `${selectedMoodData.cls} mood-glow` : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Music2
                className="w-5 h-5"
                style={selectedMoodData ? { color: "var(--mood-color)" } : {}}
              />
              <span className="font-semibold">Song Details</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="songTitle">Song Title *</Label>
                <Input
                  id="songTitle"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g. Golden Hour"
                  className="bg-muted/30 border-border/50 focus:border-primary/50"
                  required
                  data-ocid="post.input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artistName">Artist Name *</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g. JVKE"
                  className="bg-muted/30 border-border/50 focus:border-primary/50"
                  required
                  data-ocid="post.input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Message{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What does this song mean to you right now?"
                rows={3}
                className="bg-muted/30 border-border/50 focus:border-primary/50 resize-none"
                data-ocid="post.textarea"
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="#FF0000"
                aria-hidden="true"
              >
                <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
              </svg>
              <span className="font-semibold">Music Link</span>
              <span className="text-muted-foreground text-xs ml-1">
                (optional)
              </span>
            </div>

            <div className="space-y-2">
              <Input
                id="musicUrl"
                value={musicUrl}
                onChange={(e) => handleMusicUrlChange(e.target.value)}
                placeholder="Paste a YouTube URL to embed music…"
                className="bg-muted/30 border-border/50 focus:border-primary/50"
                data-ocid="post.input"
              />
              {urlError && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="post.error_state"
                >
                  {urlError}
                </p>
              )}
            </div>

            {previewMusic?.kind === "youtube" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background:
                    "color-mix(in oklch, var(--card) 80%, transparent)",
                  border:
                    "1px solid color-mix(in oklch, var(--border) 60%, transparent)",
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${previewMusic.videoId}/mqdefault.jpg`}
                  alt="YouTube thumbnail preview"
                  className="w-24 h-14 object-cover rounded-lg flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">YouTube video</p>
                  <p className="text-xs font-mono text-foreground/70 truncate">
                    ID: {previewMusic.videoId}
                  </p>
                  <p className="text-xs text-green-400 mt-0.5">
                    ✓ Ready to embed
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full aurora-bg text-white border-0 py-6 text-base font-semibold rounded-xl"
            data-ocid="post.submit_button"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending your
                vibe...
              </>
            ) : (
              `Share this Vibe ${selectedMoodData?.emoji || "✦"}`
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
