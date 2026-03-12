import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, Music2 } from "lucide-react";
import { useState } from "react";

interface Mood {
  id: string;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
  glow: string;
  songs: { title: string; videoId: string }[];
}

const MOODS: Mood[] = [
  {
    id: "sad",
    label: "Sad",
    emoji: "😢",
    description: "Melancholy & heartfelt",
    gradient: "from-blue-900/60 to-indigo-900/60",
    glow: "shadow-blue-500/30",
    songs: [
      { title: "Lewis Capaldi – Someone You Loved", videoId: "zABZyGHLKqQ" },
      { title: "Billie Eilish – when the party's over", videoId: "pbMwTqkKSps" },
      { title: "Adele – Hello", videoId: "YQHsXMglC9A" },
      { title: "The Fray – How to Save a Life", videoId: "xPb_7O1FrEY" },
      { title: "Coldplay – The Scientist", videoId: "RB-RcX5DS5A" },
      { title: "Sam Smith – Stay with Me", videoId: "pB-5XG-DbAA" },
    ],
  },
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    description: "Joyful & uplifting",
    gradient: "from-yellow-800/60 to-orange-800/60",
    glow: "shadow-yellow-400/30",
    songs: [
      { title: "Pharrell Williams – Happy", videoId: "ZbZSe6N_BXs" },
      { title: "Justin Timberlake – Can't Stop the Feeling", videoId: "ru0K8uYEZWw" },
      { title: "Bruno Mars – Uptown Funk", videoId: "OPf0YbXqDm0" },
      { title: "Katy Perry – Roar", videoId: "CevxZvSJLk8" },
      { title: "Taylor Swift – Shake It Off", videoId: "nfWlot6h_JM" },
      { title: "Lizzo – Good as Hell", videoId: "SmbmeOgWsqE" },
    ],
  },
  {
    id: "energetic",
    label: "Energetic",
    emoji: "⚡",
    description: "Pumped up & powerful",
    gradient: "from-red-900/60 to-orange-900/60",
    glow: "shadow-red-500/30",
    songs: [
      { title: "AC/DC – Thunderstruck", videoId: "v2AC41dglnM" },
      { title: "Eminem – Lose Yourself", videoId: "_Yhyp-_hX2s" },
      { title: "Kanye West – POWER", videoId: "L53gjP-TtGE" },
      { title: "The Weeknd – Blinding Lights", videoId: "4NRXx6U8ABQ" },
      { title: "Dua Lipa – Levitating", videoId: "TUVcZfQe-Kw" },
      { title: "Drake – Started From the Bottom", videoId: "RubBzkZzpUA" },
    ],
  },
  {
    id: "chill",
    label: "Chill",
    emoji: "🌊",
    description: "Relaxed & mellow",
    gradient: "from-teal-900/60 to-cyan-900/60",
    glow: "shadow-teal-400/30",
    songs: [
      { title: "Lofi Hip Hop – Relaxing Study Beats", videoId: "jfKfPfyJRdk" },
      { title: "Tame Impala – The Less I Know the Better", videoId: "2SUwOgmvzK4" },
      { title: "Frank Ocean – Thinkin Bout You", videoId: "O1OTWCd40bc" },
      { title: "Mac Miller – Circles", videoId: "vU4ITButHiw" },
      { title: "Daniel Caesar – Best Part", videoId: "yKPNSHFNI_g" },
      { title: "SZA – Good Days", videoId: "QNvnHBDuQKI" },
    ],
  },
  {
    id: "romantic",
    label: "Romantic",
    emoji: "💖",
    description: "Love & tender feelings",
    gradient: "from-pink-900/60 to-rose-900/60",
    glow: "shadow-pink-400/30",
    songs: [
      { title: "Ed Sheeran – Perfect", videoId: "2Vv-BfVoq4g" },
      { title: "John Legend – All of Me", videoId: "450p7goxZqg" },
      { title: "Bruno Mars – Just the Way You Are", videoId: "LjhCEhWiKXk" },
      { title: "Beyoncé – Crazy in Love", videoId: "ViwtNLUqkMY" },
      { title: "Adele – Make You Feel My Love", videoId: "x21OU6pFABs" },
      { title: "Taylor Swift – Lover", videoId: "AqAJLh9wuZ0" },
    ],
  },
  {
    id: "angry",
    label: "Angry",
    emoji: "🔥",
    description: "Intense & fiery",
    gradient: "from-red-950/60 to-purple-900/60",
    glow: "shadow-red-600/40",
    songs: [
      { title: "Linkin Park – Numb", videoId: "kXYiU_JCYtU" },
      { title: "Rage Against the Machine – Killing in the Name", videoId: "bWXazVeeDIY" },
      { title: "Eminem – The Way I Am", videoId: "58MQ0oKpboo" },
      { title: "Billie Eilish – bury a friend", videoId: "ZQMNBF4RRxo" },
      { title: "System of a Down – Chop Suey!", videoId: "CSvFpBOe8eY" },
      { title: "NIN – Closer", videoId: "5g5UNgSL0pA" },
    ],
  },
  {
    id: "nostalgic",
    label: "Nostalgic",
    emoji: "🌙",
    description: "Memories & reminiscing",
    gradient: "from-violet-900/60 to-purple-900/60",
    glow: "shadow-violet-400/30",
    songs: [
      { title: "The Killers – Mr. Brightside", videoId: "gGdGFtwCNBE" },
      { title: "Oasis – Wonderwall", videoId: "6hzrDeceEKc" },
      { title: "Green Day – Good Riddance", videoId: "CnQ8N1KacJc" },
      { title: "Smashing Pumpkins – 1979", videoId: "4aeETEoNfOg" },
      { title: "Radiohead – Creep", videoId: "XFkzRNyygfk" },
      { title: "REM – Losing My Religion", videoId: "xwtdhWltSIg" },
    ],
  },
  {
    id: "focused",
    label: "Focused",
    emoji: "🎯",
    description: "Deep work & concentration",
    gradient: "from-emerald-900/60 to-green-900/60",
    glow: "shadow-emerald-400/30",
    songs: [
      { title: "Hans Zimmer – Time (Inception)", videoId: "RxabLA7UQ9k" },
      { title: "Lofi Beats – Study Music Mix", videoId: "5qap5aO4i9A" },
      { title: "Brian Eno – Music for Airports", videoId: "vNwYtllyt3Q" },
      { title: "Daft Punk – Instant Crush", videoId: "a5uQMwRMHcs" },
      { title: "Interstellar Soundtrack – Main Theme", videoId: "UDVtMYqUAyw" },
      { title: "Max Richter – On the Nature of Daylight", videoId: "b_YHF4PqDkk" },
    ],
  },
];

export default function VibeListenPage() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (selectedMood) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => { setSelectedMood(null); setPlayingId(null); }}
            data-ocid="vibe_listen.back_button"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Choose another vibe
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{selectedMood.emoji}</span>
            <div>
              <h1 className="text-3xl font-display font-bold gradient-text">{selectedMood.label} Vibes</h1>
              <p className="text-muted-foreground text-sm">{selectedMood.description}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          {selectedMood.songs.map((song, i) => (
            <motion.div
              key={song.videoId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl overflow-hidden"
              data-ocid={`vibe_listen.item.${i + 1}`}
            >
              {playingId === song.videoId ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${song.videoId}?autoplay=1`}
                    title={song.title}
                    width="100%"
                    height="100%"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <button
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors`}
                  onClick={() => setPlayingId(song.videoId)}
                  data-ocid={`vibe_listen.play_button.${i + 1}`}
                >
                  <div className="w-10 h-10 rounded-full aurora-bg flex items-center justify-center shrink-0">
                    <Music2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{song.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tap to play</p>
                  </div>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl font-display font-bold gradient-text mb-3">How are you feeling?</h1>
        <p className="text-muted-foreground">Pick your vibe and we'll play you the perfect songs.</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AnimatePresence>
          {MOODS.map((mood, i) => (
            <motion.button
              key={mood.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedMood(mood)}
              className={`glass-card rounded-2xl p-6 flex flex-col items-center gap-3 text-center bg-gradient-to-br ${mood.gradient} shadow-lg ${mood.glow} hover:shadow-xl transition-all duration-200 cursor-pointer border border-white/10`}
              data-ocid={`vibe_listen.${mood.id}_button`}
            >
              <span className="text-4xl">{mood.emoji}</span>
              <div>
                <p className="font-semibold text-foreground text-sm">{mood.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{mood.description}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
