import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Heart,
  Music,
  Music2,
  Plus,
  Search,
  Shuffle,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  backendInterface as FullBackendInterface,
  MoodSong,
} from "../backend.d";
import { useMiniPlayer } from "../context/MiniPlayerContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FaceEmotionDetector = lazy(
  () => import("../components/FaceEmotionDetector"),
);

interface Song {
  title: string;
  artist: string;
  videoId: string;
  lang?: string;
}

interface MoodConfig {
  label: string;
  emoji: string;
  glowColor: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
  description: string;
  songs: Song[];
}

function extractYouTubeId(input: string): string | null {
  const str = input.trim();
  // Plain 11-char video ID
  if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
  try {
    const url = new URL(str.startsWith("http") ? str : `https://${str}`);
    // youtu.be/<id>
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      if (id && id.length === 11) return id;
    }
    // youtube.com/watch?v=<id> or music.youtube.com/watch?v=<id>
    if (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("music.youtube.com")
    ) {
      const v = url.searchParams.get("v");
      if (v && v.length === 11) return v;
      // youtube.com/shorts/<id>
      const shortsMatch = url.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      // youtube.com/embed/<id>
      const embedMatch = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // not a URL
  }
  return null;
}

const MOODS: Record<string, MoodConfig> = {
  sad: {
    label: "Sad",
    emoji: "😢",
    glowColor: "oklch(0.52 0.18 240 / 0.5)",
    borderColor: "oklch(0.52 0.18 240 / 0.5)",
    textColor: "oklch(0.72 0.18 240)",
    bgColor: "oklch(0.52 0.18 240 / 0.12)",
    description: "Dil ka dard",
    songs: [
      { title: "Tum Hi Ho", artist: "Arijit Singh", videoId: "Umqb9alkF9I" },
      {
        title: "Channa Mereya",
        artist: "Arijit Singh",
        videoId: "zbMO7v2MzXk",
      },
      {
        title: "Agar Tum Saath Ho",
        artist: "Arijit Singh",
        videoId: "sK7riqg2mr4",
      },
      { title: "Khairiyat", artist: "Arijit Singh", videoId: "asPCpEIRKnk" },
      {
        title: "Hamari Adhuri Kahani",
        artist: "Arijit Singh",
        videoId: "QZojBNfGcpQ",
      },
      {
        title: "Ae Dil Hai Mushkil",
        artist: "Arijit Singh",
        videoId: "P7RoVYhz5cc",
      },
      {
        title: "Tera Ban Jaunga",
        artist: "Akhil Sachdeva",
        videoId: "ooFvFSvL0lo",
      },
      { title: "Lut Gaye", artist: "Jubin Nautiyal", videoId: "V33jDFMr0So" },
      {
        title: "Raataan Lambiyan",
        artist: "Jubin Nautiyal",
        videoId: "JEcPGJZiMoU",
      },
      {
        title: "Phir Le Aaya Dil",
        artist: "Rekha Bhardwaj",
        videoId: "b6SBCR0cCkQ",
      },
    ],
  },
  happy: {
    label: "Happy",
    emoji: "😄",
    glowColor: "oklch(0.82 0.18 85 / 0.5)",
    borderColor: "oklch(0.82 0.18 85 / 0.5)",
    textColor: "oklch(0.72 0.22 85)",
    bgColor: "oklch(0.82 0.18 85 / 0.12)",
    description: "Khushi ka rang",
    songs: [
      {
        title: "Badtameez Dil",
        artist: "Mohit Chauhan",
        videoId: "OKiMLw6C8dM",
      },
      {
        title: "London Thumakda",
        artist: "Labh Janjua",
        videoId: "udra3oMOofw",
      },
      {
        title: "Balam Pichkari",
        artist: "Vishal Dadlani",
        videoId: "vTB7bkRt4j0",
      },
      {
        title: "Gallan Goodiyaan",
        artist: "Shankar-Ehsaan-Loy",
        videoId: "WxULCjVJaZA",
      },
      { title: "Jugnu", artist: "Badshah", videoId: "MnHSFBJ-y1Q" },
      { title: "Ghungroo", artist: "Arijit Singh", videoId: "BHvkTCOyALo" },
      {
        title: "Nagada Sang Dhol",
        artist: "Shreya Ghoshal",
        videoId: "kEwvGK2FX_c",
      },
      { title: "Kar Gayi Chull", artist: "Badshah", videoId: "yVkDxJmFRrM" },
      { title: "Kesariya", artist: "Arijit Singh", videoId: "BddP6PYo2gs" },
      {
        title: "Paani Wala Dance",
        artist: "Neha Kakkar",
        videoId: "AHrjzMPLCgU",
      },
    ],
  },
  energetic: {
    label: "Energetic",
    emoji: "⚡",
    glowColor: "oklch(0.60 0.28 22 / 0.5)",
    borderColor: "oklch(0.60 0.28 22 / 0.5)",
    textColor: "oklch(0.75 0.28 22)",
    bgColor: "oklch(0.60 0.28 22 / 0.12)",
    description: "Josh aur taqat",
    songs: [
      { title: "Malhari", artist: "Vishal Dadlani", videoId: "l_MyUGq7pgs" },
      {
        title: "Dhoom Machale",
        artist: "Sunidhi Chauhan",
        videoId: "wMVNkiOY1GI",
      },
      { title: "Dangal", artist: "Daler Mehndi", videoId: "hHTkCgFk4fY" },
      { title: "Sultan", artist: "Sukhwinder Singh", videoId: "q2wQHbANfRM" },
      { title: "Jai Ho", artist: "A.R. Rahman", videoId: "5oXWXs04eNA" },
      {
        title: "Chak De India",
        artist: "Sukhwinder Singh",
        videoId: "PKLvT9t7lyE",
      },
      { title: "Sadda Haq", artist: "Mohit Chauhan", videoId: "o_5P3d4p6XE" },
      { title: "O Saki Saki", artist: "Neha Kakkar", videoId: "1xgQyRsz-50" },
      {
        title: "Naach Meri Rani",
        artist: "Guru Randhawa",
        videoId: "xkO-81OmFAo",
      },
      {
        title: "Tattad Tattad",
        artist: "Aditya Narayan",
        videoId: "WGwTBJhvNhA",
      },
    ],
  },
  chill: {
    label: "Chill",
    emoji: "🌊",
    glowColor: "oklch(0.65 0.18 202 / 0.5)",
    borderColor: "oklch(0.65 0.18 202 / 0.5)",
    textColor: "oklch(0.72 0.18 202)",
    bgColor: "oklch(0.65 0.18 202 / 0.12)",
    description: "Sukoon ki lehren",
    songs: [
      { title: "Water", artist: "Tyla", videoId: "H4lnEiVrGMo" },
      { title: "Kun Faya Kun", artist: "A.R. Rahman", videoId: "FZm_DLwKCmg" },
      { title: "Kabira", artist: "Tochi Raina", videoId: "LrSMxL7tl1w" },
      { title: "Enna Sona", artist: "A.R. Rahman", videoId: "eDqzHlwjItE" },
      { title: "Raabta", artist: "Arijit Singh", videoId: "WEWynuWKMao" },
      {
        title: "Moh Moh Ke Dhaage",
        artist: "Monali Thakur",
        videoId: "4xbSMmr7CRY",
      },
      { title: "Ik Vaari Aa", artist: "Arijit Singh", videoId: "7P0FbILgbpc" },
      { title: "Pee Loon", artist: "Mohit Chauhan", videoId: "xhS3WMlr5yM" },
      { title: "Tum Se Hi", artist: "Mohit Chauhan", videoId: "2FZ5OABzEo0" },
      { title: "Naina", artist: "Ami Mishra", videoId: "xhkJJjmcWOQ" },
    ],
  },
  romantic: {
    label: "Romantic",
    emoji: "💕",
    glowColor: "oklch(0.72 0.28 345 / 0.5)",
    borderColor: "oklch(0.72 0.28 345 / 0.5)",
    textColor: "oklch(0.80 0.22 345)",
    bgColor: "oklch(0.72 0.28 345 / 0.12)",
    description: "Pyaar ka ehsaas",
    songs: [
      { title: "Pehla Nasha", artist: "Udit Narayan", videoId: "gzCvlFzXj3o" },
      { title: "Tujhe Dekha To", artist: "Kumar Sanu", videoId: "b2OcKQ39cnw" },
      {
        title: "Tere Sang Yaara",
        artist: "Atif Aslam",
        videoId: "k5CCqPWFGeM",
      },
      {
        title: "Pehli Nazar Mein",
        artist: "Atif Aslam",
        videoId: "3K6kGLcpU3A",
      },
      {
        title: "Agar Tum Saath Ho",
        artist: "Arijit Singh",
        videoId: "sK7riqg2mr4",
      },
      { title: "Jeena Jeena", artist: "Atif Aslam", videoId: "I2M3OMvOgAs" },
      {
        title: "Main Agar Kahoon",
        artist: "Sonu Nigam",
        videoId: "IcZEiMNjf3M",
      },
      {
        title: "Tera Hone Laga Hoon",
        artist: "Atif Aslam",
        videoId: "xfYsUrpWRUg",
      },
      { title: "Gehra Hua", artist: "Akull", videoId: "D7KVWGGcwAo" },
      {
        title: "Suraj Hua Maddham",
        artist: "Sonu Nigam",
        videoId: "YhY4kBbTKrk",
      },
    ],
  },
  angry: {
    label: "Angry",
    emoji: "🔥",
    glowColor: "oklch(0.65 0.24 40 / 0.5)",
    borderColor: "oklch(0.65 0.24 40 / 0.5)",
    textColor: "oklch(0.78 0.24 40)",
    bgColor: "oklch(0.65 0.24 40 / 0.12)",
    description: "Aag aur junoon",
    songs: [
      { title: "Sadda Haq", artist: "Mohit Chauhan", videoId: "o_5P3d4p6XE" },
      { title: "Malhari", artist: "Vishal Dadlani", videoId: "l_MyUGq7pgs" },
      {
        title: "Rang De Basanti",
        artist: "A.R. Rahman",
        videoId: "uFGUCBRU-gA",
      },
      {
        title: "Chak De India",
        artist: "Sukhwinder Singh",
        videoId: "PKLvT9t7lyE",
      },
      {
        title: "Dil Dhadakne Do",
        artist: "Shankar Mahadevan",
        videoId: "G5OLPMKSxuM",
      },
      { title: "Ik Onkar", artist: "A.R. Rahman", videoId: "Y3vlTGRPrqU" },
      { title: "Luka Chuppi", artist: "A.R. Rahman", videoId: "CpQCK6vkH3g" },
      { title: "Masakkali", artist: "Mohit Chauhan", videoId: "t5Q1Pnwsc3k" },
      { title: "Khoon Chala", artist: "K.K.", videoId: "EOrqiKEiS5c" },
      {
        title: "Dangar Doctor",
        artist: "Diljit Dosanjh",
        videoId: "J57Ci74BFJY",
      },
    ],
  },
  nostalgic: {
    label: "Nostalgic",
    emoji: "🌅",
    glowColor: "oklch(0.65 0.28 292 / 0.5)",
    borderColor: "oklch(0.65 0.28 292 / 0.5)",
    textColor: "oklch(0.78 0.22 292)",
    bgColor: "oklch(0.65 0.28 292 / 0.12)",
    description: "Purani yaadein",
    songs: [
      {
        title: "Ek Ladki Ko Dekha",
        artist: "Kumar Sanu",
        videoId: "HZg70mXq0Y4",
      },
      { title: "Purani Jeans", artist: "Ali Haider", videoId: "6W2uAl7FDv8" },
      { title: "Yeh Dosti", artist: "Kishore Kumar", videoId: "M4JgxOBfHzI" },
      { title: "O Sanam", artist: "Lucky Ali", videoId: "JkSF0-DRaWY" },
      {
        title: "Lag Ja Gale",
        artist: "Lata Mangeshkar",
        videoId: "HqPDdHGTIcc",
      },
      {
        title: "Kya Hua Tera Wada",
        artist: "Mohammed Rafi",
        videoId: "Cou-Fq7kFBA",
      },
      {
        title: "Mere Sapno Ki Rani",
        artist: "Kishore Kumar",
        videoId: "HU9pxCc-m84",
      },
      {
        title: "Tere Bina Zindagi Se",
        artist: "Kishore Kumar",
        videoId: "YD8K6yhtMHE",
      },
      {
        title: "Pyar Kiya Toh Darna Kya",
        artist: "Lata Mangeshkar",
        videoId: "7m3AK9M-vfI",
      },
      { title: "Kabhi Kabhi", artist: "Mukesh", videoId: "G2M1pVqnrSM" },
    ],
  },
  focused: {
    label: "Focused",
    emoji: "🎯",
    glowColor: "oklch(0.72 0.18 202 / 0.5)",
    borderColor: "oklch(0.72 0.22 200 / 0.5)",
    textColor: "oklch(0.80 0.20 200)",
    bgColor: "oklch(0.72 0.18 200 / 0.12)",
    description: "Mann ki ekagrata",
    songs: [
      { title: "Kun Faya Kun", artist: "A.R. Rahman", videoId: "FZm_DLwKCmg" },
      {
        title: "Dil Chahta Hai",
        artist: "Shankar-Ehsaan-Loy",
        videoId: "GkXW9S4CQHA",
      },
      { title: "Ikk Kudi", artist: "Diljit Dosanjh", videoId: "t31hRdvLfJk" },
      {
        title: "Swades Title Track",
        artist: "A.R. Rahman",
        videoId: "vfB--L_ZQCU",
      },
      {
        title: "Phir Se Ud Chala",
        artist: "Mohit Chauhan",
        videoId: "tnHU-7hWLBo",
      },
      { title: "Tu Hi Re", artist: "Hariharan", videoId: "iOL_kX0UxGY" },
      {
        title: "Ae Zindagi Gale Laga Le",
        artist: "S.P. Balasubrahmanyam",
        videoId: "qSIe7v_KnJE",
      },
      {
        title: "Ye Jo Des Hai Tera",
        artist: "A.R. Rahman",
        videoId: "6dpNOJFBvcc",
      },
      {
        title: "Tujhse Naraz Nahi Zindagi",
        artist: "Lata Mangeshkar",
        videoId: "Mxs7ANdj7Ms",
      },
      { title: "Kal Ho Naa Ho", artist: "Sonu Nigam", videoId: "s4hpVVsWhGI" },
    ],
  },
};

const STORAGE_KEY = "vibechain_fav_vibes";

interface FavSong extends Song {
  mood: string;
}

function loadFavorites(): FavSong[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavSong[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: FavSong[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

function isFavorited(favs: FavSong[], videoId: string): boolean {
  return favs.some((f) => f.videoId === videoId);
}

function MoodCard({
  moodKey,
  mood,
  isActive,
  onClick,
  ocid,
}: {
  moodKey: string;
  mood: MoodConfig;
  isActive: boolean;
  onClick: () => void;
  ocid?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      key={moodKey}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      data-ocid={ocid ?? "vibe-listen.mood.button"}
      className="relative rounded-2xl p-6 text-center transition-all duration-300 glass-card overflow-hidden cursor-pointer w-full"
      style={{
        background: isActive || hovered ? mood.bgColor : undefined,
        boxShadow: isActive
          ? `0 0 40px ${mood.glowColor}, 0 0 80px ${mood.glowColor.replace("0.5)", "0.25)")}`
          : hovered
            ? `0 0 24px ${mood.glowColor}`
            : undefined,
        border: isActive ? `1px solid ${mood.borderColor}` : undefined,
      }}
    >
      <AnimatePresence>
        {(isActive || hovered) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isActive
                ? { opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }
                : { opacity: 0.4, scale: 1 }
            }
            exit={{ opacity: 0, scale: 0.8 }}
            transition={
              isActive
                ? {
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
                : { duration: 0.2 }
            }
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${mood.glowColor.replace("0.5)", "0.15)")} 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>
      <span className="text-5xl block mb-3 relative z-10">{mood.emoji}</span>
      <span
        className="text-sm font-bold block relative z-10 tracking-wide"
        style={{ color: isActive || hovered ? mood.textColor : undefined }}
      >
        {mood.label}
      </span>
      <span
        className="text-xs block mt-1 relative z-10 opacity-70"
        style={{
          color: isActive || hovered ? mood.textColor : "oklch(0.6 0.05 260)",
        }}
      >
        {mood.description}
      </span>
    </motion.button>
  );
}

function PulsingMusicIcon({ color }: { color: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }}
      transition={{
        duration: 1.2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      className="flex items-center justify-center"
    >
      <Music2 className="w-4 h-4" style={{ color }} />
    </motion.div>
  );
}

interface AddSongFormState {
  title: string;
  artist: string;
  url: string;
  error: string;
}

const EMPTY_FORM: AddSongFormState = {
  title: "",
  artist: "",
  url: "",
  error: "",
};

// ── iTunes Search ──────────────────────────────────────────────────────────
interface ItunesTrack {
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  trackId: number;
}

interface AddSongTabsProps {
  currentMood: MoodConfig;
  addForm: AddSongFormState;
  setAddForm: React.Dispatch<React.SetStateAction<AddSongFormState>>;
  isSubmittingSong: boolean;
  actor: unknown;
  actorFetching: boolean;
  handleAddSong: () => void;
}

function AddSongTabs({
  currentMood,
  addForm,
  setAddForm,
  isSubmittingSong,
  actor,
  actorFetching,
  handleAddSong,
}: AddSongTabsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItunesTrack[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [ytSearchLoading, setYtSearchLoading] = useState(false);
  const [ytSearchFailed, setYtSearchFailed] = useState(false);
  const [importedTrack, setImportedTrack] = useState<ItunesTrack | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItunes = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=10`,
      );
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchError("Failed to search. Check your connection and try again.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.privacyredirect.com",
    "https://invidious.nerdvpn.de",
    "https://invidious.io.lol",
    "https://invidious.fdn.fr",
    "https://vid.puffyan.us",
  ];

  const searchYouTube = async (
    title: string,
    artist: string,
  ): Promise<string | null> => {
    const q = encodeURIComponent(`${title} ${artist} official audio`);
    for (const base of INVIDIOUS_INSTANCES) {
      try {
        const res = await fetch(`${base}/api/v1/search?q=${q}&type=video`, {
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].videoId) {
          return `https://www.youtube.com/watch?v=${data[0].videoId}`;
        }
      } catch {
        // try next instance
      }
    }
    return null;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItunes(val), 300);
  };

  const handleImport = async (track: ItunesTrack) => {
    setImportedTrack(track);
    setAddForm((f) => ({
      ...f,
      title: track.trackName,
      artist: track.artistName,
      url: "",
      error: "",
    }));
    setYtSearchFailed(false);
    setYtSearchLoading(true);
    const youtubeUrl = await searchYouTube(track.trackName, track.artistName);
    setYtSearchLoading(false);
    if (youtubeUrl) {
      setAddForm((f) => ({ ...f, url: youtubeUrl, error: "" }));
    } else {
      setYtSearchFailed(true);
    }
  };

  const handleClearImport = () => {
    setImportedTrack(null);
    setYtSearchFailed(false);
    setYtSearchLoading(false);
    setAddForm((f) => ({ ...f, title: "", artist: "", url: "", error: "" }));
  };

  const borderSoft = currentMood.borderColor.replace("0.5)", "0.35)");

  // If a song has been selected for import, show confirmation card
  if (importedTrack) {
    return (
      <div className="space-y-4">
        {/* Imported song card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border"
          style={{ borderColor: currentMood.borderColor }}
        >
          <img
            src={importedTrack.artworkUrl100}
            alt={importedTrack.collectionName}
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground leading-tight">
              {importedTrack.trackName}
            </p>
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {importedTrack.artistName}
            </p>
            <p className="text-[11px] text-muted-foreground/60 truncate leading-tight mt-0.5">
              {importedTrack.collectionName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearImport}
            className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0 p-1"
            aria-label="Cancel import"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>

        {/* YouTube search status */}
        <AnimatePresence>
          {ytSearchLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              style={{ color: currentMood.textColor }}
            >
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
              Finding YouTube link automatically...
            </motion.div>
          )}
          {!ytSearchLoading && ytSearchFailed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              <p className="text-xs text-destructive px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                Couldn&apos;t find a link automatically. Paste a YouTube URL
                below:
              </p>
              <Input
                data-ocid="vibe-listen.add_song.youtube_input"
                placeholder="https://youtube.com/watch?v=..."
                value={addForm.url}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, url: e.target.value }))
                }
                className="rounded-xl bg-white/5 border-white/20 text-sm"
              />
            </motion.div>
          )}
          {!ytSearchLoading && !ytSearchFailed && addForm.url && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              style={{ color: currentMood.textColor }}
            >
              <span>✅ YouTube link found</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {addForm.error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              data-ocid="vibe-listen.add_song.error_state"
              className="text-xs text-destructive font-medium"
            >
              {addForm.error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Add button */}
        <Button
          type="button"
          size="sm"
          onClick={handleAddSong}
          disabled={
            isSubmittingSong ||
            ytSearchLoading ||
            (ytSearchFailed && !addForm.url) ||
            (!actor && actorFetching)
          }
          data-ocid="vibe-listen.add_song.submit_button"
          className="w-full rounded-xl font-semibold gap-2"
          style={{
            background: currentMood.bgColor,
            color: currentMood.textColor,
            border: `1px solid ${currentMood.borderColor}`,
            boxShadow: `0 0 16px ${currentMood.glowColor.replace("0.5)", "0.2)")}`,
          }}
        >
          <Plus className="w-4 h-4" />
          {isSubmittingSong
            ? "Adding..."
            : !actor && actorFetching
              ? "Connecting..."
              : ytSearchLoading
                ? "Searching..."
                : "Add to Vibe"}
        </Button>

        <button
          type="button"
          onClick={handleClearImport}
          className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
        >
          ← Back to search
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by song or artist..."
        value={searchQuery}
        onChange={handleSearchChange}
        data-ocid="music.search_input"
        className="bg-transparent border-border/50 focus:border-current rounded-lg text-sm"
        style={{ borderColor: borderSoft }}
      />

      {searchLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          data-ocid="music.search.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-2.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searchError && !searchLoading && (
        <p
          data-ocid="music.search.error_state"
          className="text-xs text-destructive text-center py-4"
        >
          {searchError}
        </p>
      )}

      {!searchLoading &&
        !searchError &&
        searchQuery &&
        searchResults.length === 0 && (
          <p
            data-ocid="music.search.empty_state"
            className="text-xs text-muted-foreground text-center py-4"
          >
            No songs found. Try a different search.
          </p>
        )}

      {!searchLoading && !searchError && searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-0.5">
          {searchResults.map((track, idx) => (
            <motion.div
              key={track.trackId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              data-ocid={`music.result.item.${idx + 1}`}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              <img
                src={track.artworkUrl100}
                alt={track.collectionName}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground leading-tight">
                  {track.trackName}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {track.artistName}
                </p>
                <p className="text-[10px] text-muted-foreground/60 truncate leading-tight">
                  {track.collectionName}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                data-ocid={`music.result.import_button.${idx + 1}`}
                onClick={() => handleImport(track)}
                className="shrink-0 h-7 px-2 text-xs rounded-lg font-semibold"
                style={{
                  background: currentMood.bgColor,
                  color: currentMood.textColor,
                  border: `1px solid ${currentMood.borderColor}`,
                }}
              >
                Add
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {!searchQuery && !searchLoading && (
        <p className="text-xs text-muted-foreground/60 text-center py-4">
          Type above to search the music library
        </p>
      )}
    </div>
  );
}

export default function VibeListen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavSong[]>(loadFavorites);
  const [backendSongs, setBackendSongs] = useState<MoodSong[]>([]);
  const [loadingBackendSongs, setLoadingBackendSongs] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [shuffledSong, setShuffledSong] = useState<Song | null>(null);
  const [showFaceDetector, setShowFaceDetector] = useState(false);
  // Per-mood add form open state
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddSongFormState>(EMPTY_FORM);
  const [isSubmittingSong, setIsSubmittingSong] = useState(false);
  const [addedByUsernames, setAddedByUsernames] = useState<
    Record<string, string>
  >({});

  const {
    playingVideoId,
    playSong: ctxPlaySong,
    stopPlaying,
  } = useMiniPlayer();
  const { actor: _actor, isFetching: actorFetching } = useActor();
  const actor = _actor as unknown as FullBackendInterface | null;
  const actorRef = useRef<FullBackendInterface | null>(null);
  actorRef.current = actor;
  const { identity } = useInternetIdentity();

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // Fetch backend songs when mood changes
  useEffect(() => {
    if (!selectedMood || !actor) return;
    setLoadingBackendSongs(true);
    actor
      .getMoodSongs(selectedMood)
      .then(async (songs) => {
        setBackendSongs(songs);
        // Fetch usernames for unique addedBy principals
        const uniquePrincipals = [
          ...new Set(songs.map((s) => s.addedBy.toString())),
        ];
        const entries = await Promise.all(
          uniquePrincipals.map(async (p) => {
            try {
              const name = await actor.getPublicUsername(
                songs.find((s) => s.addedBy.toString() === p)!.addedBy,
              );
              return [p, name?.trim() ? `@${name}` : `${p.slice(0, 8)}...`] as [
                string,
                string,
              ];
            } catch {
              return [p, `${p.slice(0, 8)}...`] as [string, string];
            }
          }),
        );
        setAddedByUsernames(Object.fromEntries(entries));
      })
      .catch(() => setBackendSongs([]))
      .finally(() => setLoadingBackendSongs(false));
  }, [selectedMood, actor]);

  const toggleFavorite = (song: Song, mood: string) => {
    setFavorites((prev) => {
      if (isFavorited(prev, song.videoId)) {
        return prev.filter((f) => f.videoId !== song.videoId);
      }
      return [...prev, { ...song, mood }];
    });
  };

  const removeFavorite = (videoId: string) => {
    setFavorites((prev) => prev.filter((f) => f.videoId !== videoId));
  };

  const removeUserSong = async (videoId: string, songId: bigint) => {
    try {
      if (actor) await actor.deleteMoodSong(songId);
      setBackendSongs((prev) => prev.filter((s) => s.videoId !== videoId));
    } catch (err) {
      console.error("Failed to delete song", err);
    }
  };

  const currentMood = selectedMood ? MOODS[selectedMood] : null;

  // Merged song list (curated + user) for current mood
  const currentUserSongs: (MoodSong & Song)[] = backendSongs.map((s) => ({
    ...s,
    lang: undefined,
  }));

  const mergedSongs: Song[] = currentMood
    ? [...currentMood.songs, ...currentUserSongs]
    : [];

  const handleShuffle = () => {
    if (!currentMood || !selectedMood) return;
    const randomIdx = Math.floor(Math.random() * mergedSongs.length);
    const random = mergedSongs[randomIdx];
    setShuffledSong(random);
    ctxPlaySong(
      random.videoId,
      { title: random.title, artist: random.artist },
      currentMood,
      mergedSongs,
      randomIdx,
    );
  };

  const playSong = (song: Song) => {
    if (!currentMood || !selectedMood) return;
    if (playingVideoId === song.videoId) {
      stopPlaying();
    } else {
      const idx = mergedSongs.findIndex((s) => s.videoId === song.videoId);
      ctxPlaySong(
        song.videoId,
        { title: song.title, artist: song.artist },
        currentMood,
        mergedSongs,
        idx >= 0 ? idx : 0,
      );
    }
  };

  const handleAddSong = async () => {
    const { title, artist, url } = addForm;
    if (!title.trim() || !artist.trim() || !url.trim()) {
      setAddForm((f) => ({ ...f, error: "Please fill in all fields." }));
      return;
    }
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setAddForm((f) => ({
        ...f,
        error: "Invalid YouTube URL or video ID. Please check and try again.",
      }));
      return;
    }
    if (!selectedMood) return;
    // Avoid duplicates in this mood
    const alreadyExists = mergedSongs.some((s) => s.videoId === videoId);
    if (alreadyExists) {
      setAddForm((f) => ({
        ...f,
        error: "This song is already in the list.",
      }));
      return;
    }
    if (!identity) {
      setAddForm((f) => ({ ...f, error: "Please log in to add songs." }));
      return;
    }
    setAddForm((f) => ({ ...f, error: "" }));
    setIsSubmittingSong(true);
    try {
      // Wait up to 8 seconds for actor to be ready
      let resolvedActor = actorRef.current;
      if (!resolvedActor) {
        for (let i = 0; i < 16; i++) {
          await new Promise((r) => setTimeout(r, 500));
          resolvedActor = actorRef.current;
          if (resolvedActor) break;
        }
      }
      if (!resolvedActor) {
        setAddForm((f) => ({
          ...f,
          error: "Could not connect. Please wait a moment and try again.",
        }));
        setIsSubmittingSong(false);
        return;
      }
      await resolvedActor.addMoodSong(
        selectedMood,
        title.trim(),
        artist.trim(),
        videoId,
      );
      const songs = await resolvedActor.getMoodSongs(selectedMood);
      setBackendSongs(songs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const friendly =
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("not logged") ||
        msg.toLowerCase().includes("anonymous")
          ? "You must be logged in to add songs."
          : msg.toLowerCase().includes("already")
            ? "This song is already in the list."
            : `Failed to add song: ${msg}`;
      setAddForm((f) => ({ ...f, error: friendly }));
      setIsSubmittingSong(false);
      return;
    }
    setIsSubmittingSong(false);
    setAddForm(EMPTY_FORM);
    setAddFormOpen(false);
  };

  const moodFavorites = selectedMood
    ? favorites.filter((f) => f.mood === selectedMood)
    : [];

  return (
    <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
      {/* Face Emotion Detector overlay */}
      {showFaceDetector && (
        <Suspense fallback={null}>
          <FaceEmotionDetector
            onMoodDetected={(mood) => {
              setSelectedMood(mood);
              setShuffledSong(null);
              setShowFaceDetector(false);
            }}
            onClose={() => setShowFaceDetector(false)}
          />
        </Suspense>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center gap-3 mb-5">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-14 h-14 rounded-2xl aurora-bg flex items-center justify-center shadow-glow"
          >
            <Music className="w-7 h-7 text-white" />
          </motion.div>
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold gradient-text mb-3">
          Vibe Listen
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Apna mood, apna gaana, apna vibe. 🇮🇳
        </p>
      </motion.div>

      {/* Mood Grid */}
      <section data-ocid="vibe-listen.section" className="mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
        >
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Aaj kaisa feel ho raha hai?
          </h2>

          {/* Scan My Vibe button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFaceDetector(true)}
            data-ocid="vibe-listen.scan_mood.button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.42 0.26 296 / 0.4), oklch(0.38 0.28 340 / 0.4))",
              border: "1px solid oklch(0.62 0.26 296 / 0.5)",
              color: "oklch(0.88 0.18 296)",
              boxShadow:
                "0 0 20px oklch(0.62 0.26 296 / 0.25), inset 0 1px 0 oklch(0.75 0.15 296 / 0.2)",
            }}
          >
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                repeatDelay: 1.5,
              }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.85 0.15 296 / 0.2), transparent)",
              }}
            />
            <Camera className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Scan My Vibe</span>
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(MOODS).map(([key, mood], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 + 0.1 }}
            >
              <MoodCard
                moodKey={key}
                mood={mood}
                isActive={selectedMood === key}
                ocid="vibe-listen.mood.button"
                onClick={() => {
                  if (selectedMood !== key) {
                    setAddFormOpen(false);
                    setAddForm(EMPTY_FORM);
                  }
                  setSelectedMood(selectedMood === key ? null : key);
                  setShuffledSong(null);
                }}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* All Favorites Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAllFavorites((v) => !v)}
          data-ocid="vibe-listen.favorites.toggle"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Heart
            className="w-4 h-4"
            style={
              favorites.length > 0
                ? {
                    color: "oklch(0.80 0.22 345)",
                    fill: "oklch(0.80 0.22 345)",
                  }
                : {}
            }
          />
          My Favorite Vibes
          {favorites.length > 0 && (
            <Badge
              className="text-xs px-2 py-0"
              style={{
                background: "oklch(0.72 0.28 345 / 0.2)",
                color: "oklch(0.85 0.22 345)",
                borderColor: "oklch(0.72 0.28 345 / 0.4)",
              }}
            >
              {favorites.length}
            </Badge>
          )}
          {showAllFavorites ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* All Favorites Panel */}
      <AnimatePresence>
        {showAllFavorites && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            data-ocid="vibe_listen.favorites_section"
            className="mb-10 overflow-hidden"
          >
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-base font-semibold gradient-text mb-4">
                Saved Vibes {favorites.length > 0 && `(${favorites.length})`}
              </h3>
              {favorites.length === 0 ? (
                <div
                  data-ocid="vibe-listen.favorites.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No saved vibes yet. Heart a song to save it here.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {favorites.map((fav, idx) => {
                    const moodConfig = MOODS[fav.mood];
                    return (
                      <motion.div
                        key={fav.videoId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.04 }}
                        data-ocid={`vibe-listen.favorites.item.${idx + 1}`}
                        className="flex items-center gap-3 p-3 rounded-xl glass-card group"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${fav.videoId}/mqdefault.jpg`}
                          alt={fav.title}
                          className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">
                            {fav.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {fav.artist}
                          </p>
                        </div>
                        {moodConfig && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full hidden sm:block"
                            style={{
                              background: moodConfig.bgColor,
                              color: moodConfig.textColor,
                            }}
                          >
                            {moodConfig.emoji} {moodConfig.label}
                          </span>
                        )}
                        <a
                          href={`https://youtube.com/watch?v=${fav.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-ocid="vibe-listen.favorites.play.button"
                          className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeFavorite(fav.videoId)}
                          data-ocid="vibe-listen.favorites.delete_button"
                          className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Song List for selected mood */}
      <AnimatePresence mode="wait">
        {currentMood && selectedMood && (
          <motion.section
            key={selectedMood}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            data-ocid="vibe-listen.songs.section"
          >
            {/* Section header */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-4xl">{currentMood.emoji}</span>
              <div className="flex-1">
                <h2
                  className="text-2xl font-display font-bold"
                  style={{ color: currentMood.textColor }}
                >
                  {currentMood.label} Vibes
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mergedSongs.length} songs · tap any row to play
                </p>
              </div>
              <Button
                onClick={handleShuffle}
                data-ocid="vibe_listen.shuffle_button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border transition-all hover:scale-105"
                style={{
                  borderColor: currentMood.borderColor,
                  color: currentMood.textColor,
                  background: currentMood.bgColor,
                }}
              >
                <Shuffle className="w-4 h-4" />
                Shuffle Play
              </Button>
            </div>

            {/* Mood-scoped favorites chips */}
            <AnimatePresence>
              {moodFavorites.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div
                    className="glass-card rounded-2xl p-4"
                    style={{ border: `1px solid ${currentMood.borderColor}` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Heart
                        className="w-4 h-4"
                        style={{
                          color: "oklch(0.80 0.22 345)",
                          fill: "oklch(0.80 0.22 345)",
                        }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: currentMood.textColor }}
                      >
                        Your {currentMood.label} Favorites (
                        {moodFavorites.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {moodFavorites.map((fav) => (
                        <button
                          key={fav.videoId}
                          type="button"
                          onClick={() => playSong(fav)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 cursor-pointer"
                          style={{
                            background: currentMood.bgColor,
                            color: currentMood.textColor,
                          }}
                        >
                          <Music2 className="w-3 h-3" />
                          {fav.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shuffled song highlight */}
            <AnimatePresence>
              {shuffledSong && !playingVideoId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 glass-card rounded-2xl p-4 flex items-center gap-4"
                  style={{ boxShadow: `0 0 30px ${currentMood.glowColor}` }}
                >
                  <Shuffle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: currentMood.textColor }}
                  />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Now shuffling
                    </p>
                    <p
                      className="font-semibold"
                      style={{ color: currentMood.textColor }}
                    >
                      {shuffledSong.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shuffledSong.artist}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShuffledSong(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Curated Song rows */}
            <div className="grid gap-2">
              {currentMood.songs.map((song, idx) => {
                const saved = isFavorited(favorites, song.videoId);
                const isCurrentlyPlaying = playingVideoId === song.videoId;
                return (
                  <motion.div
                    key={song.videoId}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    data-ocid={`vibe-listen.songs.item.${idx + 1}`}
                    onClick={() => playSong(song)}
                    className="glass-card rounded-xl overflow-hidden group flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                    style={{
                      boxShadow: isCurrentlyPlaying
                        ? `0 0 28px ${currentMood.glowColor}, 0 0 56px ${currentMood.glowColor.replace("0.5)", "0.2)")}`
                        : saved
                          ? "0 0 12px oklch(0.72 0.28 345 / 0.3)"
                          : undefined,
                      background: isCurrentlyPlaying
                        ? currentMood.bgColor
                        : undefined,
                      border: isCurrentlyPlaying
                        ? `1px solid ${currentMood.borderColor}`
                        : undefined,
                    }}
                  >
                    {/* Number / playing icon */}
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={
                        isCurrentlyPlaying
                          ? {
                              background: currentMood.glowColor,
                              color: "white",
                            }
                          : {
                              background: currentMood.bgColor,
                              color: currentMood.textColor,
                            }
                      }
                    >
                      {isCurrentlyPlaying ? (
                        <PulsingMusicIcon color="white" />
                      ) : (
                        idx + 1
                      )}
                    </span>

                    {/* Thumbnail */}
                    <div
                      className="flex-shrink-0 relative rounded-lg overflow-hidden"
                      style={{ width: 60, height: 45 }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      {!isCurrentlyPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Music2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {isCurrentlyPlaying && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: `${currentMood.bgColor}` }}
                        >
                          <PulsingMusicIcon color={currentMood.textColor} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{
                            color: isCurrentlyPlaying
                              ? currentMood.textColor
                              : undefined,
                          }}
                          title={song.title}
                        >
                          {song.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {song.artist}
                      </p>
                      {!isCurrentlyPlaying && (
                        <p
                          className="text-xs opacity-50 mt-0.5"
                          style={{ color: currentMood.textColor }}
                        >
                          Tap to play
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFavorite(song, selectedMood)}
                        data-ocid={`vibe_listen.favorite_button.${idx + 1}`}
                        className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                        aria-label={
                          saved ? "Remove from favorites" : "Save to favorites"
                        }
                      >
                        <Heart
                          className="w-4 h-4 transition-all"
                          style={{
                            fill: saved
                              ? "oklch(0.80 0.22 345)"
                              : "transparent",
                            stroke: saved
                              ? "oklch(0.80 0.22 345)"
                              : "currentColor",
                          }}
                        />
                      </button>
                      <a
                        href={`https://youtube.com/watch?v=${song.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-ocid="vibe-listen.songs.play.button"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                        title="Open in YouTube"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}

              {/* User-added songs */}
              {loadingBackendSongs && (
                <div
                  className="flex items-center gap-2 py-3 px-4 text-xs text-muted-foreground"
                  data-ocid="vibe-listen.songs.loading_state"
                >
                  <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full" />
                  Loading community songs...
                </div>
              )}
              <AnimatePresence>
                {currentUserSongs.map((song, uIdx) => {
                  const globalIdx = currentMood.songs.length + uIdx;
                  const saved = isFavorited(favorites, song.videoId);
                  const isCurrentlyPlaying = playingVideoId === song.videoId;
                  return (
                    <motion.div
                      key={`user-${song.videoId}`}
                      initial={{ opacity: 0, x: -16, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 16, scale: 0.97 }}
                      transition={{ duration: 0.3 }}
                      data-ocid={`vibe-listen.songs.item.${globalIdx + 1}`}
                      onClick={() => playSong(song)}
                      className="glass-card rounded-xl overflow-hidden group flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                      style={{
                        boxShadow: isCurrentlyPlaying
                          ? `0 0 28px ${currentMood.glowColor}, 0 0 56px ${currentMood.glowColor.replace("0.5)", "0.2)")}`
                          : saved
                            ? "0 0 12px oklch(0.72 0.28 345 / 0.3)"
                            : undefined,
                        background: isCurrentlyPlaying
                          ? currentMood.bgColor
                          : undefined,
                        border: isCurrentlyPlaying
                          ? `1px solid ${currentMood.borderColor}`
                          : `1px solid ${currentMood.borderColor.replace("0.5)", "0.18)")}`,
                      }}
                    >
                      {/* Number / playing icon */}
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={
                          isCurrentlyPlaying
                            ? {
                                background: currentMood.glowColor,
                                color: "white",
                              }
                            : {
                                background: currentMood.bgColor,
                                color: currentMood.textColor,
                              }
                        }
                      >
                        {isCurrentlyPlaying ? (
                          <PulsingMusicIcon color="white" />
                        ) : (
                          globalIdx + 1
                        )}
                      </span>

                      {/* Thumbnail */}
                      <div
                        className="flex-shrink-0 relative rounded-lg overflow-hidden"
                        style={{ width: 60, height: 45 }}
                      >
                        <img
                          src={`https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        {!isCurrentlyPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Music2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {isCurrentlyPlaying && (
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ background: currentMood.bgColor }}
                          >
                            <PulsingMusicIcon color={currentMood.textColor} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{
                              color: isCurrentlyPlaying
                                ? currentMood.textColor
                                : undefined,
                            }}
                            title={song.title}
                          >
                            {song.title}
                          </p>
                          {/* User-added badge */}
                          <span
                            className="flex-shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: currentMood.bgColor,
                              color: currentMood.textColor,
                              border: `1px solid ${currentMood.borderColor}`,
                            }}
                          >
                            <UserPlus className="w-2.5 h-2.5" />
                            Community
                            {addedByUsernames[song.addedBy.toString()] && (
                              <span className="opacity-80">
                                · {addedByUsernames[song.addedBy.toString()]}
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {song.artist}
                        </p>
                        {!isCurrentlyPlaying && (
                          <p
                            className="text-xs opacity-50 mt-0.5"
                            style={{ color: currentMood.textColor }}
                          >
                            Tap to play
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div
                        className="flex items-center gap-1 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFavorite(song, selectedMood)}
                          data-ocid={`vibe-listen.user_song.favorite_button.${uIdx + 1}`}
                          className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          aria-label={
                            saved
                              ? "Remove from favorites"
                              : "Save to favorites"
                          }
                        >
                          <Heart
                            className="w-4 h-4 transition-all"
                            style={{
                              fill: saved
                                ? "oklch(0.80 0.22 345)"
                                : "transparent",
                              stroke: saved
                                ? "oklch(0.80 0.22 345)"
                                : "currentColor",
                            }}
                          />
                        </button>
                        <a
                          href={`https://youtube.com/watch?v=${song.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-ocid="vibe-listen.user_song.play.button"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                          title="Open in YouTube"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUserSong(song.videoId, song.id);
                          }}
                          data-ocid={`vibe-listen.user_song.delete_button.${uIdx + 1}`}
                          className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove song"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Add a Song section */}
            <div className="mt-6">
              {/* Toggle button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="vibe-listen.add_song.button"
                onClick={() => {
                  setAddFormOpen((v) => !v);
                  setAddForm(EMPTY_FORM);
                }}
                className="gap-2 rounded-xl border transition-all hover:scale-105"
                style={{
                  borderColor: currentMood.borderColor,
                  color: currentMood.textColor,
                  background: currentMood.bgColor,
                }}
              >
                {addFormOpen ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add a Song
                  </>
                )}
              </Button>

              {/* Collapsible form */}
              <AnimatePresence>
                {addFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className="glass-card rounded-2xl p-5 mt-3"
                      style={{
                        border: `1px solid ${currentMood.borderColor}`,
                        boxShadow: `0 0 20px ${currentMood.glowColor.replace("0.5)", "0.15)")}`,
                      }}
                      data-ocid="vibe-listen.add_song.panel"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <UserPlus
                          className="w-4 h-4"
                          style={{ color: currentMood.textColor }}
                        />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: currentMood.textColor }}
                        >
                          Add your song to {currentMood.label} vibes
                        </span>
                      </div>

                      <AddSongTabs
                        currentMood={currentMood}
                        addForm={addForm}
                        setAddForm={setAddForm}
                        isSubmittingSong={isSubmittingSong}
                        actor={actor}
                        actorFetching={actorFetching}
                        handleAddSong={handleAddSong}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Prompt to select mood */}
      {!selectedMood && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="vibe-listen.prompt.section"
          className="text-center py-16 text-muted-foreground"
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="text-6xl block mb-5"
          >
            🎵
          </motion.span>
          <p className="text-lg font-medium">
            Pick a mood above to start listening
          </p>
          <p className="text-sm mt-2 opacity-60">
            8 moods · 80 songs · sab vibes welcome 🇮🇳
          </p>
          <p className="text-xs mt-3 opacity-40">
            Or tap "Scan My Vibe" to detect your mood from your face 🎭
          </p>
        </motion.div>
      )}
    </div>
  );
}
