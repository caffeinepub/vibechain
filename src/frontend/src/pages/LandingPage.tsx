import { Button } from "@/components/ui/button";
import { Heart, Loader2, Music2, Sparkles, Users, Waves } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  {
    id: "feed",
    icon: <Waves className="w-6 h-6" />,
    title: "Real-Time Vibe Feed",
    desc: "Feel the pulse of souls around the world. Every mood, every song, every second.",
    color: "text-vibe-violet",
  },
  {
    id: "music",
    icon: <Music2 className="w-6 h-6" />,
    title: "Music as Language",
    desc: "Your soundtrack speaks what words can't. Share the song that carries your soul today.",
    color: "text-vibe-teal",
  },
  {
    id: "circles",
    icon: <Heart className="w-6 h-6" />,
    title: "Healing Circles",
    desc: "Join spaces built for feelings. No judgment. No followers. Just honest human connection.",
    color: "text-vibe-rose",
  },
  {
    id: "beyond",
    icon: <Users className="w-6 h-6" />,
    title: "Beyond Followers",
    desc: "Your worth isn't measured in numbers. Vibe authentically. Connect genuinely.",
    color: "text-vibe-amber",
  },
];

const SAMPLE_MOODS = [
  {
    id: "peaceful-a",
    mood: "Peaceful",
    emoji: "🌿",
    song: "Golden Hour",
    artist: "JVKE",
  },
  {
    id: "melancholic-a",
    mood: "Melancholic",
    emoji: "🌙",
    song: "Skinny Love",
    artist: "Bon Iver",
  },
  {
    id: "excited-a",
    mood: "Excited",
    emoji: "✨",
    song: "Levitating",
    artist: "Dua Lipa",
  },
  {
    id: "grateful-a",
    mood: "Grateful",
    emoji: "🌸",
    song: "Beautiful Day",
    artist: "U2",
  },
  {
    id: "energetic-a",
    mood: "Energetic",
    emoji: "🔥",
    song: "Power",
    artist: "Kanye West",
  },
  {
    id: "lonely-a",
    mood: "Lonely",
    emoji: "🌌",
    song: "The Night We Met",
    artist: "Lord Huron",
  },
  {
    id: "peaceful-b",
    mood: "Peaceful",
    emoji: "🌿",
    song: "Golden Hour",
    artist: "JVKE",
  },
  {
    id: "melancholic-b",
    mood: "Melancholic",
    emoji: "🌙",
    song: "Skinny Love",
    artist: "Bon Iver",
  },
  {
    id: "excited-b",
    mood: "Excited",
    emoji: "✨",
    song: "Levitating",
    artist: "Dua Lipa",
  },
  {
    id: "grateful-b",
    mood: "Grateful",
    emoji: "🌸",
    song: "Beautiful Day",
    artist: "U2",
  },
  {
    id: "energetic-b",
    mood: "Energetic",
    emoji: "🔥",
    song: "Power",
    artist: "Kanye West",
  },
  {
    id: "lonely-b",
    mood: "Lonely",
    emoji: "🌌",
    song: "The Night We Met",
    artist: "Lord Huron",
  },
];

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('/assets/generated/vibechain-hero.dim_1600x800.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />

        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-vibe-violet/10 blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-vibe-teal/8 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-vibe-rose/5 blur-3xl" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-vibe-amber animate-pulse-slow" />
              <span className="text-sm text-muted-foreground tracking-widest uppercase">
                A new kind of connection
              </span>
              <Sparkles className="w-5 h-5 text-vibe-amber animate-pulse-slow" />
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-bold leading-tight mb-6">
              <span className="gradient-text">Feel.</span>{" "}
              <span className="text-foreground">Share.</span>{" "}
              <span className="gradient-text-teal">Connect.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              VIBECHAIN is where moods and music replace followers and filters.
              It's not about how you look — it's about how you{" "}
              <em className="text-foreground">feel</em>.
            </p>

            <p className="text-base text-muted-foreground/70 mb-10 font-display italic">
              How do you feel right now?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="aurora-bg text-white border-0 font-semibold px-8 py-6 text-lg rounded-2xl shadow-glow hover:opacity-90 transition-opacity"
                data-ocid="landing.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                    Connecting...
                  </>
                ) : (
                  <>Join the Vibe ✦</>
                )}
              </Button>
              <Button
                onClick={login}
                disabled={isLoggingIn}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground px-8 py-6 text-lg rounded-2xl border border-border/50 hover:border-border"
                data-ocid="landing.secondary_button"
              >
                Explore Vibes →
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Floating mood pills marquee */}
        <div className="absolute bottom-8 left-0 right-0 overflow-hidden">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="flex gap-4 whitespace-nowrap"
          >
            {SAMPLE_MOODS.map((m) => (
              <span
                key={m.id}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm glass-card border-border/30 mood-${m.mood.toLowerCase()}`}
              >
                <span>{m.emoji}</span>
                <span className="mood-badge px-2 py-0.5 rounded-full text-xs">
                  {m.mood}
                </span>
                <span className="text-muted-foreground">
                  {m.song} — {m.artist}
                </span>
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-display font-bold mb-4">
            Connection without the <span className="gradient-text">noise</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every mood matters. Every song tells a story. Every connection is
            real.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className={`mb-4 ${f.color}`}>{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <p className="text-5xl mb-6">🌌</p>
          <h2 className="text-4xl font-display font-bold mb-4">
            Your vibe is waiting
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands sharing their emotional truth through music.
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="aurora-bg text-white border-0 font-semibold px-10 py-6 text-lg rounded-2xl"
            data-ocid="landing.cta.primary_button"
          >
            Start Vibing
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
