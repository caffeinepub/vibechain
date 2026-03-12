import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "motion/react";
import {
  Camera,
  ChevronLeft,
  Heart,
  Loader2,
  Music2,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MoodConfig, PlaylistSong } from "../context/MiniPlayerContext";
import { useMiniPlayer } from "../context/MiniPlayerContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MoodSongRecord {
  id: bigint;
  title: string;
  mood: string;
  addedBy: { toText(): string };
  timestamp: bigint;
  artist: string;
  videoId: string;
}

interface CuratedSong {
  title: string;
  artist: string;
  videoId: string;
  lang?: string;
}

interface MoodData {
  id: string;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
  glow: string;
  moodConfig: MoodConfig;
  songs: CuratedSong[];
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function extractYouTubeId(input: string): string | null {
  const str = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
  try {
    const url = new URL(str.startsWith("http") ? str : `https://${str}`);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      if (id && id.length === 11) return id;
    }
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && v.length === 11) return v;
      const shortsMatch = url.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch (_) {
    // not a URL
  }
  return null;
}

function analyseFrame(video: HTMLVideoElement): { mood: string; confidence: number } {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 60;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { mood: "chill", confidence: 62 };
  ctx.drawImage(video, 0, 0, 80, 60);
  const data = ctx.getImageData(0, 0, 80, 60).data;
  let r = 0; let g = 0; let b = 0; let count = 0;
  for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
  r /= count; g /= count; b /= count;
  const brightness = (r + g + b) / 3;
  const warmth = r - b;
  const greenDom = g - Math.max(r, b);
  const conf = Math.floor(72 + Math.random() * 20);
  if (brightness > 160 && warmth > 20) return { mood: "happy", confidence: conf };
  if (brightness > 150 && warmth > 10) return { mood: "energetic", confidence: conf };
  if (brightness > 140 && greenDom > 10) return { mood: "focused", confidence: conf };
  if (brightness > 130) return { mood: "chill", confidence: conf };
  if (warmth > 30 && brightness < 130) return { mood: "angry", confidence: conf };
  if (warmth > 10 && brightness < 120) return { mood: "romantic", confidence: conf };
  if (b > r && b > g && brightness < 120) return { mood: "sad", confidence: conf };
  if (brightness < 100) return { mood: "nostalgic", confidence: conf };
  const moods = ["happy", "chill", "energetic", "focused", "romantic", "sad", "nostalgic", "angry"];
  return { mood: moods[Math.floor(Math.random() * moods.length)], confidence: conf };
}

// ─── Mood Data ─────────────────────────────────────────────────────────────────

const MOODS: MoodData[] = [
  {
    id: "sad",
    label: "Sad",
    emoji: "😢",
    description: "Melancholy & heartfelt",
    gradient: "from-blue-900/60 to-indigo-900/60",
    glow: "shadow-blue-500/30",
    moodConfig: {
      textColor: "oklch(0.72 0.18 240)",
      bgColor: "oklch(0.52 0.18 240 / 0.12)",
      borderColor: "oklch(0.52 0.18 240 / 0.5)",
      glowColor: "oklch(0.52 0.18 240 / 0.4)",
      emoji: "😢",
      label: "Sad",
    },
    songs: [
      { title: "Someone You Loved", artist: "Lewis Capaldi", videoId: "zABZyGHLKqQ" },
      { title: "when the party's over", artist: "Billie Eilish", videoId: "pbMwTqkKSps" },
      { title: "Hello", artist: "Adele", videoId: "YQHsXMglC9A" },
      { title: "How to Save a Life", artist: "The Fray", videoId: "xPb_7O1FrEY" },
      { title: "The Scientist", artist: "Coldplay", videoId: "RB-RcX5DS5A" },
      { title: "Stay with Me", artist: "Sam Smith", videoId: "pB-5XG-DbAA" },
      { title: "Channa Mereya", artist: "Arijit Singh", videoId: "284Ov7ysmfA", lang: "हिंदी" },
      { title: "Tum Hi Ho", artist: "Arijit Singh", videoId: "Umqb9KENgmk", lang: "हिंदी" },
      { title: "Yaad Aayega", artist: "KK", videoId: "LBNfPZPWdQ4", lang: "हिंदी" },
      { title: "Bewafa Tera Masoom Chehra", artist: "Jubin Nautiyal", videoId: "n7oEQMWi98c", lang: "हिंदी" },
    ],
  },
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    description: "Joyful & uplifting",
    gradient: "from-yellow-800/60 to-orange-800/60",
    glow: "shadow-yellow-400/30",
    moodConfig: {
      textColor: "oklch(0.82 0.18 85)",
      bgColor: "oklch(0.70 0.18 85 / 0.12)",
      borderColor: "oklch(0.70 0.18 85 / 0.5)",
      glowColor: "oklch(0.70 0.18 85 / 0.4)",
      emoji: "😊",
      label: "Happy",
    },
    songs: [
      { title: "Happy", artist: "Pharrell Williams", videoId: "ZbZSe6N_BXs" },
      { title: "Can't Stop the Feeling", artist: "Justin Timberlake", videoId: "ru0K8uYEZWw" },
      { title: "Uptown Funk", artist: "Bruno Mars", videoId: "OPf0YbXqDm0" },
      { title: "Roar", artist: "Katy Perry", videoId: "CevxZvSJLk8" },
      { title: "Shake It Off", artist: "Taylor Swift", videoId: "nfWlot6h_JM" },
      { title: "Good as Hell", artist: "Lizzo", videoId: "SmbmeOgWsqE" },
      { title: "Paagal", artist: "Badshah", videoId: "lXFZfBpCMro", lang: "हिंदी" },
      { title: "Aankh Marey", artist: "Neha Kakkar", videoId: "xJeRuGVl_C4", lang: "हिंदी" },
      { title: "Lahore", artist: "Guru Randhawa", videoId: "YKMEiFlGFqM", lang: "हिंदी" },
      { title: "Do You Know", artist: "Diljit Dosanjh", videoId: "7tVLcn4UgNE", lang: "हिंदी" },
    ],
  },
  {
    id: "energetic",
    label: "Energetic",
    emoji: "⚡",
    description: "Pumped up & powerful",
    gradient: "from-red-900/60 to-orange-900/60",
    glow: "shadow-red-500/30",
    moodConfig: {
      textColor: "oklch(0.78 0.24 40)",
      bgColor: "oklch(0.65 0.24 40 / 0.12)",
      borderColor: "oklch(0.65 0.24 40 / 0.5)",
      glowColor: "oklch(0.65 0.24 40 / 0.4)",
      emoji: "⚡",
      label: "Energetic",
    },
    songs: [
      { title: "Thunderstruck", artist: "AC/DC", videoId: "v2AC41dglnM" },
      { title: "Lose Yourself", artist: "Eminem", videoId: "_Yhyp-_hX2s" },
      { title: "POWER", artist: "Kanye West", videoId: "L53gjP-TtGE" },
      { title: "Blinding Lights", artist: "The Weeknd", videoId: "4NRXx6U8ABQ" },
      { title: "Levitating", artist: "Dua Lipa", videoId: "TUVcZfQe-Kw" },
      { title: "Started From the Bottom", artist: "Drake", videoId: "RubBzkZzpUA" },
      { title: "Brown Rang", artist: "Honey Singh", videoId: "SFmHGi0so58", lang: "हिंदी" },
      { title: "DJ Waley Babu", artist: "Badshah", videoId: "yIIGQB6EMAM", lang: "हिंदी" },
      { title: "Mere Gully Mein", artist: "Divine", videoId: "lMUzSAzDSNk", lang: "हिंदी" },
      { title: "Swag Mera Desi", artist: "Raftaar", videoId: "OW_2ZDmW4YQ", lang: "हिंदी" },
    ],
  },
  {
    id: "chill",
    label: "Chill",
    emoji: "🌊",
    description: "Relaxed & mellow",
    gradient: "from-teal-900/60 to-cyan-900/60",
    glow: "shadow-teal-400/30",
    moodConfig: {
      textColor: "oklch(0.72 0.18 202)",
      bgColor: "oklch(0.55 0.18 202 / 0.12)",
      borderColor: "oklch(0.55 0.18 202 / 0.5)",
      glowColor: "oklch(0.55 0.18 202 / 0.4)",
      emoji: "🌊",
      label: "Chill",
    },
    songs: [
      { title: "Lofi Hip Hop – Study Beats", artist: "Lofi Girl", videoId: "jfKfPfyJRdk" },
      { title: "The Less I Know the Better", artist: "Tame Impala", videoId: "2SUwOgmvzK4" },
      { title: "Thinkin Bout You", artist: "Frank Ocean", videoId: "O1OTWCd40bc" },
      { title: "Good Days", artist: "SZA", videoId: "QNvnHBDuQKI" },
      { title: "Water", artist: "Tyla", videoId: "WlpHJFGnXvA" },
      { title: "Best Part", artist: "Daniel Caesar", videoId: "yKPNSHFNI_g" },
      { title: "cold/mess", artist: "Prateek Kuhad", videoId: "_SHNgl2Giek", lang: "हिंदी" },
      { title: "Agar Tum Saath Ho", artist: "Arijit Singh", videoId: "sVODFGR0yes", lang: "हिंदी" },
      { title: "Bass Rani", artist: "Nucleya", videoId: "3-BoxIBt_kY", lang: "हिंदी" },
      { title: "Khoj", artist: "When Chai Met Toast", videoId: "Y_e0A_qFATo", lang: "हिंदी" },
    ],
  },
  {
    id: "romantic",
    label: "Romantic",
    emoji: "💖",
    description: "Love & tender feelings",
    gradient: "from-pink-900/60 to-rose-900/60",
    glow: "shadow-pink-400/30",
    moodConfig: {
      textColor: "oklch(0.80 0.22 345)",
      bgColor: "oklch(0.62 0.22 345 / 0.12)",
      borderColor: "oklch(0.62 0.22 345 / 0.5)",
      glowColor: "oklch(0.62 0.22 345 / 0.4)",
      emoji: "💖",
      label: "Romantic",
    },
    songs: [
      { title: "Perfect", artist: "Ed Sheeran", videoId: "2Vv-BfVoq4g" },
      { title: "All of Me", artist: "John Legend", videoId: "450p7goxZqg" },
      { title: "Just the Way You Are", artist: "Bruno Mars", videoId: "LjhCEhWiKXk" },
      { title: "Make You Feel My Love", artist: "Adele", videoId: "x21OU6pFABs" },
      { title: "Lover", artist: "Taylor Swift", videoId: "AqAJLh9wuZ0" },
      { title: "Gehra Hua", artist: "Vishal Mishra", videoId: "CwbNSiaMPzg" },
      { title: "Ae Dil Hai Mushkil", artist: "Arijit Singh", videoId: "6FURuLYrR_Q", lang: "हिंदी" },
      { title: "Pehli Nazar Mein", artist: "Atif Aslam", videoId: "lDQ8FVq7tOM", lang: "हिंदी" },
      { title: "Sun Raha Hai Na Tu", artist: "Shreya Ghoshal", videoId: "8tMSKqMt9GU", lang: "हिंदी" },
      { title: "Tum Se Hi", artist: "Mohit Chauhan", videoId: "z5bGmKM5hLo", lang: "हिंदी" },
    ],
  },
  {
    id: "angry",
    label: "Angry",
    emoji: "🔥",
    description: "Intense & fiery",
    gradient: "from-red-950/60 to-purple-900/60",
    glow: "shadow-red-600/40",
    moodConfig: {
      textColor: "oklch(0.78 0.24 22)",
      bgColor: "oklch(0.62 0.24 22 / 0.12)",
      borderColor: "oklch(0.62 0.24 22 / 0.5)",
      glowColor: "oklch(0.62 0.24 22 / 0.4)",
      emoji: "🔥",
      label: "Angry",
    },
    songs: [
      { title: "Numb", artist: "Linkin Park", videoId: "kXYiU_JCYtU" },
      { title: "Killing in the Name", artist: "RATM", videoId: "bWXazVeeDIY" },
      { title: "The Way I Am", artist: "Eminem", videoId: "58MQ0oKpboo" },
      { title: "bury a friend", artist: "Billie Eilish", videoId: "ZQMNBF4RRxo" },
      { title: "Chop Suey!", artist: "System of a Down", videoId: "CSvFpBOe8eY" },
      { title: "Closer", artist: "NIN", videoId: "5g5UNgSL0pA" },
      { title: "Bandook", artist: "Raftaar", videoId: "mwFe0JXfOBg", lang: "हिंदी" },
      { title: "Gunehgar", artist: "Divine", videoId: "jKv8guJVvJw", lang: "हिंदी" },
      { title: "Dope Shope", artist: "Yo Yo Honey Singh", videoId: "nL4NWsNXFLY", lang: "हिंदी" },
      { title: "Machayenge", artist: "Emiway Bantai", videoId: "L3v1GexZLXI", lang: "हिंदी" },
    ],
  },
  {
    id: "nostalgic",
    label: "Nostalgic",
    emoji: "🌙",
    description: "Memories & reminiscing",
    gradient: "from-violet-900/60 to-purple-900/60",
    glow: "shadow-violet-400/30",
    moodConfig: {
      textColor: "oklch(0.78 0.22 292)",
      bgColor: "oklch(0.60 0.22 292 / 0.12)",
      borderColor: "oklch(0.60 0.22 292 / 0.5)",
      glowColor: "oklch(0.60 0.22 292 / 0.4)",
      emoji: "🌙",
      label: "Nostalgic",
    },
    songs: [
      { title: "Mr. Brightside", artist: "The Killers", videoId: "gGdGFtwCNBE" },
      { title: "Wonderwall", artist: "Oasis", videoId: "6hzrDeceEKc" },
      { title: "Good Riddance", artist: "Green Day", videoId: "CnQ8N1KacJc" },
      { title: "1979", artist: "Smashing Pumpkins", videoId: "4aeETEoNfOg" },
      { title: "Creep", artist: "Radiohead", videoId: "XFkzRNyygfk" },
      { title: "Losing My Religion", artist: "REM", videoId: "xwtdhWltSIg" },
      { title: "Pehla Nasha", artist: "Udit Narayan", videoId: "b2OcKQ39cnw", lang: "हिंदी" },
      { title: "Ek Ladki Ko Dekha", artist: "Kumar Sanu", videoId: "wYUXWMxKyAk", lang: "हिंदी" },
      { title: "Kehna Hi Kya", artist: "A.R. Rahman", videoId: "5R0h9rBFgkE", lang: "हिंदी" },
      { title: "Yaaron", artist: "KK", videoId: "s_vJlWCOFhg", lang: "हिंदी" },
    ],
  },
  {
    id: "focused",
    label: "Focused",
    emoji: "🎯",
    description: "Deep work & concentration",
    gradient: "from-emerald-900/60 to-green-900/60",
    glow: "shadow-emerald-400/30",
    moodConfig: {
      textColor: "oklch(0.80 0.20 165)",
      bgColor: "oklch(0.60 0.20 165 / 0.12)",
      borderColor: "oklch(0.60 0.20 165 / 0.5)",
      glowColor: "oklch(0.60 0.20 165 / 0.4)",
      emoji: "🎯",
      label: "Focused",
    },
    songs: [
      { title: "Time (Inception)", artist: "Hans Zimmer", videoId: "RxabLA7UQ9k" },
      { title: "Study Music Mix", artist: "Lofi Beats", videoId: "5qap5aO4i9A" },
      { title: "Music for Airports", artist: "Brian Eno", videoId: "vNwYtllyt3Q" },
      { title: "Instant Crush", artist: "Daft Punk", videoId: "a5uQMwRMHcs" },
      { title: "Interstellar Main Theme", artist: "Hans Zimmer", videoId: "UDVtMYqUAyw" },
      { title: "On the Nature of Daylight", artist: "Max Richter", videoId: "b_YHF4PqDkk" },
      { title: "Roja Theme", artist: "A.R. Rahman", videoId: "S_kfGWHC37Q", lang: "हिंदी" },
      { title: "Dil Chahta Hai Title", artist: "Shankar-Ehsaan-Loy", videoId: "2fNMSRsJOeE", lang: "हिंदी" },
      { title: "Jai Ho Title Track", artist: "Pritam", videoId: "5oXWXs04eNA", lang: "हिंदी" },
      { title: "Maa Tujhe Salaam", artist: "A.R. Rahman", videoId: "XoNiUW8MVGM", lang: "हिंदी" },
    ],
  },
  {
    id: "bollywood",
    label: "Bollywood",
    emoji: "🎬",
    description: "Desi beats & filmi vibes",
    gradient: "from-orange-900/60 to-yellow-900/60",
    glow: "shadow-orange-400/30",
    moodConfig: {
      textColor: "oklch(0.82 0.20 55)",
      bgColor: "oklch(0.65 0.20 55 / 0.12)",
      borderColor: "oklch(0.65 0.20 55 / 0.5)",
      glowColor: "oklch(0.65 0.20 55 / 0.4)",
      emoji: "🎬",
      label: "Bollywood",
    },
    songs: [
      { title: "Kesariya", artist: "Arijit Singh", videoId: "BddP6PYo2gs", lang: "हिंदी" },
      { title: "Deewani Mastani", artist: "Shreya Ghoshal", videoId: "zMI_vOTFBuU", lang: "हिंदी" },
      { title: "Genda Phool", artist: "Badshah", videoId: "RmFzMflFChs", lang: "हिंदी" },
      { title: "Lover", artist: "Diljit Dosanjh", videoId: "hfJJwO5C9rc", lang: "हिंदी" },
      { title: "O Humsafar", artist: "Neha Kakkar", videoId: "rFHHSBMgkU4", lang: "हिंदी" },
      { title: "Chaiyya Chaiyya", artist: "A.R. Rahman", videoId: "ooLR0-lSc-s", lang: "हिंदी" },
      { title: "Tera Hua", artist: "Atif Aslam", videoId: "ILSuqNunaUQ", lang: "हिंदी" },
      { title: "Kaise Hua", artist: "Pritam", videoId: "CwbNSiaMPzg", lang: "हिंदी" },
      { title: "Pehle Pyaar Ka Pehla Gham", artist: "Vishal Mishra", videoId: "KdJWMR-iB7k", lang: "हिंदी" },
      { title: "Lut Gaye", artist: "Jubin Nautiyal", videoId: "cHBqP1bCpfA", lang: "हिंदी" },
    ],
  },
];

// ─── Face Scan Modal ────────────────────────────────────────────────────────────

type ScanState = "loading" | "streaming" | "scanning" | "result" | "error" | "no-face";

interface FaceScanModalProps {
  open: boolean;
  onClose: () => void;
  onMoodDetected: (moodId: string) => void;
}

function FaceScanModal({ open, onClose, onMoodDetected }: FaceScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanState, setScanState] = useState<ScanState>("loading");
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<{ mood: string; confidence: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const MOOD_INFO: Record<string, { label: string; emoji: string }> = {
    happy: { label: "Happy", emoji: "😊" },
    sad: { label: "Sad", emoji: "😢" },
    angry: { label: "Angry", emoji: "🔥" },
    energetic: { label: "Energetic", emoji: "⚡" },
    chill: { label: "Chill", emoji: "🌊" },
    romantic: { label: "Romantic", emoji: "💖" },
    nostalgic: { label: "Nostalgic", emoji: "🌙" },
    focused: { label: "Focused", emoji: "🎯" },
    bollywood: { label: "Bollywood", emoji: "🎬" },
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const startCamera = useCallback(async () => {
    setScanState("loading");
    setCountdown(3);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState("streaming");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera error";
      setErrorMsg(
        msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : "Could not start camera. Please check your device.",
      );
      setScanState("error");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    startCamera();
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // Countdown
  useEffect(() => {
    if (scanState !== "streaming") return;
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [scanState]);

  // Scan when countdown hits 0
  useEffect(() => {
    if (countdown !== 0 || scanState !== "streaming") return;
    setScanState("scanning");
    const timer = setTimeout(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        setScanState("no-face");
        return;
      }
      const detected = analyseFrame(videoRef.current);
      setResult(detected);
      setScanState("result");
    }, 1200);
    return () => clearTimeout(timer);
  }, [countdown, scanState]);

  const applyMood = () => {
    if (!result) return;
    stopCamera();
    onMoodDetected(result.mood);
    onClose();
  };

  const moodInfo = result ? MOOD_INFO[result.mood] : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="face_scan.dialog"
        className="max-w-sm p-0 overflow-hidden border-0"
        style={{
          background: "oklch(0.10 0.05 265 / 0.98)",
          border: "1px solid oklch(0.62 0.26 296 / 0.4)",
          boxShadow: "0 0 80px oklch(0.62 0.26 296 / 0.3)",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-center">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
              className="text-3xl block mb-1"
            >
              🎭
            </motion.span>
            <span
              className="text-lg font-bold"
              style={{
                background: "linear-gradient(135deg, oklch(0.82 0.18 296), oklch(0.85 0.22 340))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Vibe Scanner
            </span>
          </DialogTitle>
          <p className="text-xs text-center" style={{ color: "oklch(0.55 0.08 265)" }}>
            Let your face reveal your mood
          </p>
        </DialogHeader>

        <div className="px-6 py-5">
          {/* Camera view */}
          <div className="relative flex justify-center mb-4">
            <div className="relative">
              {(scanState === "streaming" || scanState === "scanning") && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ border: "2px solid oklch(0.62 0.26 296 / 0.7)", margin: "-8px" }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.22, 1], opacity: [0.35, 0.08, 0.35] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ border: "2px solid oklch(0.72 0.28 340 / 0.5)", margin: "-16px" }}
                  />
                </>
              )}
              {scanState === "scanning" && (
                <motion.div
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 z-10 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent, oklch(0.72 0.28 296), transparent)",
                    boxShadow: "0 0 8px oklch(0.72 0.28 296)",
                  }}
                />
              )}
              <video
                ref={videoRef}
                muted
                playsInline
                className="rounded-2xl object-cover"
                style={{
                  width: 264,
                  height: 198,
                  display: scanState === "loading" || scanState === "error" ? "none" : "block",
                  border: "1px solid oklch(0.62 0.26 296 / 0.4)",
                  transform: "scaleX(-1)",
                }}
              />
              {scanState === "result" && moodInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2"
                  style={{ background: "oklch(0.10 0.05 265 / 0.88)" }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="text-5xl"
                  >
                    {moodInfo.emoji}
                  </motion.span>
                  <p className="text-base font-bold" style={{ color: "oklch(0.85 0.18 296)" }}>
                    {moodInfo.label}
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.60 0.08 265)" }}>
                    {result?.confidence}% confident
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="text-center min-h-[60px] flex flex-col items-center justify-center gap-3">
            {scanState === "loading" && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: "oklch(0.62 0.26 296 / 0.6)", borderTopColor: "transparent" }} />
                <p className="text-sm" style={{ color: "oklch(0.62 0.26 296)" }}>Starting camera...</p>
              </div>
            )}
            {scanState === "streaming" && countdown > 0 && (
              <>
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-black"
                  style={{ color: "oklch(0.82 0.26 296)" }}
                >
                  {countdown}
                </motion.div>
                <p className="text-xs" style={{ color: "oklch(0.50 0.06 265)" }}>Hold still, scanning in {countdown}...</p>
              </>
            )}
            {scanState === "scanning" && (
              <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                className="text-sm font-semibold"
                style={{ color: "oklch(0.82 0.22 296)" }}
              >
                ✨ Reading your vibe...
              </motion.p>
            )}
            {scanState === "result" && moodInfo && result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 w-full">
                <p className="text-sm font-bold" style={{ color: "oklch(0.85 0.18 296)" }}>
                  {moodInfo.emoji} {moodInfo.label} — {result.confidence}% confident
                </p>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setResult(null); startCamera(); }}
                    data-ocid="face_scan.scan_button"
                    className="flex-1 text-xs"
                    style={{ borderColor: "oklch(0.45 0.10 265 / 0.5)", color: "oklch(0.65 0.08 265)" }}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Scan again
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyMood}
                    data-ocid="face_scan.apply_button"
                    className="flex-1 text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.55 0.26 296), oklch(0.62 0.28 340))",
                      color: "white",
                      border: "none",
                    }}
                  >
                    Apply this vibe ✨
                  </Button>
                </div>
              </motion.div>
            )}
            {scanState === "no-face" && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm" style={{ color: "oklch(0.72 0.20 40)" }}>Could not read your vibe — try again</p>
                <Button variant="outline" size="sm" onClick={() => startCamera()} data-ocid="face_scan.scan_button" className="text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" /> Retry
                </Button>
              </div>
            )}
            {scanState === "error" && (
              <div className="flex flex-col items-center gap-2" data-ocid="face_scan.error_state">
                <p className="text-xs text-center" style={{ color: "oklch(0.72 0.20 20)" }}>{errorMsg}</p>
                <p className="text-xs" style={{ color: "oklch(0.45 0.05 265)" }}>Allow camera access and try again.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            data-ocid="face_scan.close_button"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Song Modal ─────────────────────────────────────────────────────────────

interface AddSongModalProps {
  open: boolean;
  onClose: () => void;
  defaultMoodId: string;
  actor: BackendActor | null;
  actorFetching: boolean;
  onSuccess: () => void;
}

interface BackendActor {
  getMoodSongs(mood: string): Promise<MoodSongRecord[]>;
  addMoodSong(mood: string, title: string, artist: string, videoId: string): Promise<bigint>;
  deleteMoodSong(songId: bigint): Promise<void>;
  getPublicUsername(user: { toText(): string }): Promise<string | null>;
  saveCallerUserProfile(profile: { username: string; bio: string }): Promise<void>;
}

function AddSongModal({ open, onClose, defaultMoodId, actor, actorFetching, onSuccess }: AddSongModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [moodId, setMoodId] = useState(defaultMoodId);
  const [urlError, setUrlError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      setUrl(""); setTitle(""); setArtist(""); setMoodId(defaultMoodId);
      setUrlError(""); setSubmitError(""); setSubmitting(false);
    }
  }, [open, defaultMoodId]);

  const validateUrl = (val: string) => {
    if (!val.trim()) { setUrlError("YouTube URL is required"); return false; }
    const id = extractYouTubeId(val);
    if (!id) { setUrlError("Please enter a valid YouTube URL (e.g., youtube.com/watch?v=...)"); return false; }
    setUrlError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateUrl(url)) return;
    if (!title.trim()) return;
    if (!artist.trim()) return;

    const videoId = extractYouTubeId(url);
    if (!videoId) return;

    if (!actor) {
      setSubmitError(actorFetching ? "Still connecting to the network. Please wait a moment and try again." : "Not connected to the network. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const tryAdd = async (): Promise<void> => {
      await actor.addMoodSong(moodId, title.trim(), artist.trim(), videoId);
    };

    try {
      await tryAdd();
      toast.success("Song added! Everyone can now hear your vibe 🎵");
      onSuccess();
      onClose();
    } catch (firstErr: unknown) {
      // Auto-retry once
      try {
        await new Promise((r) => setTimeout(r, 1200));
        await tryAdd();
        toast.success("Song added! Everyone can now hear your vibe 🎵");
        onSuccess();
        onClose();
      } catch (retryErr: unknown) {
        const msg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        if (msg.includes("no update method") || msg.includes("method")) {
          setSubmitError("Backend method not found. The canister may need redeployment.");
        } else if (msg.includes("not registered") || msg.includes("registered")) {
          setSubmitError("Your account is not registered yet. Please wait a moment and try again.");
        } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("connect")) {
          setSubmitError("Could not connect. Try again in a moment.");
        } else {
          setSubmitError(`Failed to add song: ${msg.slice(0, 120)}`);
        }
        setSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent
        data-ocid="add_song.dialog"
        className="max-w-md border-0"
        style={{
          background: "oklch(0.10 0.05 265 / 0.98)",
          border: "1px solid oklch(0.55 0.22 296 / 0.4)",
          boxShadow: "0 0 60px oklch(0.55 0.22 296 / 0.2)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-lg font-bold"
            style={{
              background: "linear-gradient(135deg, oklch(0.82 0.18 296), oklch(0.85 0.22 340))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            + Add a Song to this Vibe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* YouTube URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">YouTube URL *</Label>
            <Input
              data-ocid="add_song.input"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (urlError) validateUrl(e.target.value); }}
              onBlur={() => validateUrl(url)}
              className="text-sm"
              style={{
                background: "oklch(0.14 0.04 265 / 0.8)",
                border: urlError ? "1px solid oklch(0.65 0.22 22)" : "1px solid oklch(0.30 0.06 265 / 0.6)",
                color: "oklch(0.90 0.04 265)",
              }}
            />
            {urlError && (
              <p className="text-xs" style={{ color: "oklch(0.72 0.20 22)" }} data-ocid="add_song.error_state">
                {urlError}
              </p>
            )}
            <p className="text-xs" style={{ color: "oklch(0.45 0.05 265)" }}>
              Supported: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, music.youtube.com
            </p>
          </div>

          {/* Song title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Song Title *</Label>
            <Input
              placeholder="e.g. Blinding Lights"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
              style={{
                background: "oklch(0.14 0.04 265 / 0.8)",
                border: "1px solid oklch(0.30 0.06 265 / 0.6)",
                color: "oklch(0.90 0.04 265)",
              }}
            />
          </div>

          {/* Artist */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Artist Name *</Label>
            <Input
              placeholder="e.g. The Weeknd"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="text-sm"
              style={{
                background: "oklch(0.14 0.04 265 / 0.8)",
                border: "1px solid oklch(0.30 0.06 265 / 0.6)",
                color: "oklch(0.90 0.04 265)",
              }}
            />
          </div>

          {/* Mood */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Mood</Label>
            <select
              value={moodId}
              onChange={(e) => setMoodId(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{
                background: "oklch(0.14 0.04 265 / 0.8)",
                border: "1px solid oklch(0.30 0.06 265 / 0.6)",
                color: "oklch(0.90 0.04 265)",
              }}
            >
              {MOODS.map((m) => (
                <option key={m.id} value={m.id} style={{ background: "oklch(0.14 0.04 265)" }}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit error */}
          {submitError && (
            <div
              data-ocid="add_song.error_state"
              className="flex flex-col gap-2 rounded-xl p-3 text-xs"
              style={{ background: "oklch(0.55 0.20 22 / 0.12)", border: "1px solid oklch(0.55 0.20 22 / 0.4)", color: "oklch(0.72 0.18 22)" }}
            >
              <span>{submitError}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSubmit}
                className="text-xs self-start"
                style={{ borderColor: "oklch(0.55 0.20 22 / 0.5)", color: "oklch(0.72 0.18 22)" }}
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            data-ocid="add_song.cancel_button"
            className="flex-1"
            style={{ borderColor: "oklch(0.35 0.06 265 / 0.5)", color: "oklch(0.60 0.06 265)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !url.trim() || !title.trim() || !artist.trim()}
            data-ocid="add_song.submit_button"
            className="flex-1 font-semibold"
            style={{
              background: submitting || !url.trim() || !title.trim() || !artist.trim()
                ? "oklch(0.30 0.05 265 / 0.5)"
                : "linear-gradient(135deg, oklch(0.55 0.26 296), oklch(0.62 0.28 340))",
              color: "white",
              border: "none",
            }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
            ) : (
              "Add Song"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Song Card ──────────────────────────────────────────────────────────────────

interface SongCardProps {
  song: CuratedSong;
  index: number;
  isPlaying: boolean;
  mood: MoodData;
  canDelete?: boolean;
  isCommunity?: boolean;
  communityUser?: string | null;
  onPlay: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

function SongCard({
  song,
  index,
  isPlaying,
  mood,
  canDelete,
  isCommunity,
  communityUser,
  onPlay,
  onDelete,
  onFavorite,
  isFavorite,
}: SongCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group relative rounded-2xl overflow-hidden"
      data-ocid={`song_list.item.${index + 1}`}
      style={{
        background: isPlaying
          ? `linear-gradient(135deg, ${mood.moodConfig.bgColor}, oklch(0.12 0.05 265 / 0.8))`
          : "oklch(0.13 0.04 265 / 0.7)",
        border: isPlaying
          ? `1px solid ${mood.moodConfig.borderColor}`
          : "1px solid oklch(0.22 0.04 265 / 0.5)",
        borderLeft: `3px solid ${mood.moodConfig.textColor}`,
        backdropFilter: "blur(12px)",
        boxShadow: isPlaying ? `0 4px 24px ${mood.moodConfig.glowColor}` : undefined,
        transition: "all 0.2s ease",
      }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={onPlay}
        aria-label={`Play ${song.title}`}
      >
        {/* Thumbnail / play icon */}
        <div
          className="relative flex-shrink-0 rounded-lg overflow-hidden"
          style={{ width: 44, height: 33 }}
        >
          <img
            src={`https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`}
            alt={song.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity"
            style={{
              background: isPlaying ? `${mood.moodConfig.bgColor}` : "rgba(0,0,0,0.4)",
              opacity: isPlaying ? 1 : 0,
            }}
          >
            {isPlaying && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="w-2 h-2 rounded-full"
                style={{ background: mood.moodConfig.textColor }}
              />
            )}
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <Play className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate leading-snug"
            style={{ color: isPlaying ? mood.moodConfig.textColor : "oklch(0.90 0.04 265)" }}
          >
            {song.title}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{song.artist}</p>
          {isCommunity && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "oklch(0.55 0.10 296)" }}>
              Community{communityUser ? ` · @${communityUser}` : ""}
            </p>
          )}
          {!isCommunity && (
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.08 265)" }}>Curated</p>
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onFavorite && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: isFavorite ? "oklch(0.75 0.22 345)" : "oklch(0.50 0.05 265)" }}
          >
            <Heart className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete song"
            data-ocid={`song_list.delete_button.${index + 1}`}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            style={{ color: "oklch(0.55 0.16 22)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Song List View ─────────────────────────────────────────────────────────────

interface SongListViewProps {
  mood: MoodData;
  actor: BackendActor | null;
  actorFetching: boolean;
  identity: { getPrincipal(): { toText(): string } } | undefined;
  onBack: () => void;
}

function SongListView({ mood, actor, actorFetching, identity, onBack }: SongListViewProps) {
  const { playSong, playingVideoId } = useMiniPlayer();
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communitySongs, setCommunitySongs] = useState<MoodSongRecord[]>([]);
  const [communityUsernames, setCommunityUsernames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"curated" | "new">("curated");
  const [hindiOnly, setHindiOnly] = useState(false);
  const [showAddSong, setShowAddSong] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const myPrincipal = identity?.getPrincipal().toText();

  const fetchCommunity = useCallback(async () => {
    if (!actor) return;
    setCommunityLoading(true);
    setCommunityError(null);
    try {
      const songs = await actor.getMoodSongs(mood.id);
      setCommunitySongs(songs);
      // Fetch usernames in parallel
      const principals = [...new Set(songs.map((s) => s.addedBy.toText()))];
      const entries = await Promise.all(
        principals.map(async (p) => {
          const song = songs.find((s) => s.addedBy.toText() === p);
          if (!song) return [p, ""] as [string, string];
          try {
            const username = await actor.getPublicUsername(song.addedBy);
            return [p, username ?? ""] as [string, string];
          } catch (_) {
            return [p, ""] as [string, string];
          }
        }),
      );
      setCommunityUsernames(Object.fromEntries(entries));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCommunityError(msg.includes("method") ? "Could not load community songs (method not found)." : "Could not load songs.");
    } finally {
      setCommunityLoading(false);
    }
  }, [actor, mood.id]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  // Wait for actor
  useEffect(() => {
    if (actor && communityLoading) fetchCommunity();
  }, [actor, communityLoading, fetchCommunity]);

  const handleDelete = async (song: MoodSongRecord) => {
    if (!actor) return;
    try {
      await actor.deleteMoodSong(song.id);
      setCommunitySongs((prev) => prev.filter((s) => s.id !== song.id));
      toast.success("Song removed");
    } catch (err: unknown) {
      toast.error("Could not delete song");
    }
  };

  const toggleFavorite = (videoId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  };

  // Build combined list
  const curatedSongs: CuratedSong[] = mood.songs;
  const communityAsSongs: (CuratedSong & { isCommunity: true; addedByText: string; recordId: bigint })[] = communitySongs.map((s) => ({
    title: s.title,
    artist: s.artist,
    videoId: s.videoId,
    isCommunity: true,
    addedByText: s.addedBy.toText(),
    recordId: s.id,
  }));

  const allSongs = sortOrder === "curated"
    ? [...curatedSongs.map((s) => ({ ...s, isCommunity: false as const })), ...communityAsSongs]
    : [...communityAsSongs, ...curatedSongs.map((s) => ({ ...s, isCommunity: false as const }))];

  const filtered = allSongs.filter((s) => {
    const matchSearch = !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHindi = !hindiOnly || ("lang" in s && s.lang === "हिंदी") || s.isCommunity;
    return matchSearch && matchHindi;
  });

  const playlist: PlaylistSong[] = filtered.map((s) => ({ title: s.title, artist: s.artist, videoId: s.videoId }));

  const handlePlay = (song: typeof filtered[number], idx: number) => {
    playSong(song.videoId, { title: song.title, artist: song.artist, videoId: song.videoId }, mood.moodConfig, playlist, idx);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
      {/* Back button + header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Button
          variant="ghost"
          className="mb-5 -ml-2 text-muted-foreground hover:text-foreground text-sm"
          onClick={onBack}
          data-ocid="vibe_listen.back_button"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Choose another vibe
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{mood.emoji}</span>
            <div>
              <h1
                className="text-3xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${mood.moodConfig.textColor}, oklch(0.90 0.08 265))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {mood.label} Vibes
              </h1>
              <p className="text-sm text-muted-foreground">{mood.description}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddSong(true)}
            data-ocid="add_song.open_modal_button"
            className="flex-shrink-0 text-xs font-semibold gap-1.5"
            style={{
              background: "linear-gradient(135deg, oklch(0.45 0.22 296 / 0.8), oklch(0.52 0.25 340 / 0.8))",
              border: "1px solid oklch(0.55 0.22 296 / 0.4)",
              color: "white",
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Song
          </Button>
        </div>
      </motion.div>

      {/* Search + controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3 mb-6"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search songs or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-ocid="song_list.search_input"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{
              background: "oklch(0.13 0.04 265 / 0.8)",
              border: "1px solid oklch(0.25 0.05 265 / 0.6)",
              color: "oklch(0.90 0.04 265)",
              outline: "none",
            }}
          />
        </div>

        {/* Sort + Hindi filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort toggle */}
          <div
            className="flex rounded-lg overflow-hidden text-xs"
            data-ocid="song_list.sort_toggle"
            style={{ border: "1px solid oklch(0.25 0.05 265 / 0.6)" }}
          >
            {(["curated", "new"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSortOrder(opt)}
                className="px-3 py-1.5 font-medium transition-colors capitalize"
                style={{
                  background: sortOrder === opt ? mood.moodConfig.bgColor : "transparent",
                  color: sortOrder === opt ? mood.moodConfig.textColor : "oklch(0.55 0.06 265)",
                  borderRight: opt === "curated" ? "1px solid oklch(0.25 0.05 265 / 0.6)" : undefined,
                }}
              >
                {opt === "curated" ? "Curated" : "New First"}
              </button>
            ))}
          </div>

          {/* Hindi filter */}
          <button
            type="button"
            onClick={() => setHindiOnly((v) => !v)}
            data-ocid="song_list.filter_toggle"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: hindiOnly ? mood.moodConfig.bgColor : "oklch(0.13 0.04 265 / 0.8)",
              border: `1px solid ${hindiOnly ? mood.moodConfig.borderColor : "oklch(0.25 0.05 265 / 0.6)"}`,
              color: hindiOnly ? mood.moodConfig.textColor : "oklch(0.55 0.06 265)",
            }}
          >
            All / हिंदी
          </button>
        </div>
      </motion.div>

      {/* Song list */}
      {communityLoading && !actorFetching ? (
        <div data-ocid="vibe_listen.loading_state" className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" style={{ background: "oklch(0.15 0.04 265 / 0.6)" }} />
          ))}
        </div>
      ) : communityError ? (
        <div
          data-ocid="vibe_listen.error_state"
          className="flex flex-col items-center gap-3 py-10 text-center"
        >
          <p className="text-muted-foreground text-sm">{communityError}</p>
          <Button variant="outline" size="sm" onClick={fetchCommunity} className="text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div data-ocid="song_list.empty_state" className="flex flex-col items-center gap-3 py-16 text-center">
          <Music2 className="w-10 h-10" style={{ color: mood.moodConfig.textColor, opacity: 0.4 }} />
          <p className="text-muted-foreground text-sm">No songs match your search</p>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="text-xs">
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
            {filtered.map((song, i) => {
              const isCommunity = song.isCommunity;
              const communityUser = isCommunity
                ? communityUsernames[(song as typeof communityAsSongs[number]).addedByText] || null
                : null;
              const isOwnSong = isCommunity && (song as typeof communityAsSongs[number]).addedByText === myPrincipal;

              return (
                <SongCard
                  key={`${song.videoId}-${i}`}
                  song={song}
                  index={i}
                  isPlaying={playingVideoId === song.videoId}
                  mood={mood}
                  isCommunity={isCommunity}
                  communityUser={communityUser}
                  canDelete={isOwnSong}
                  isFavorite={favorites.has(song.videoId)}
                  onPlay={() => handlePlay(song, i)}
                  onDelete={
                    isOwnSong
                      ? () => handleDelete((song as typeof communityAsSongs[number]) as unknown as MoodSongRecord)
                      : undefined
                  }
                  onFavorite={() => toggleFavorite(song.videoId)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AddSongModal
        open={showAddSong}
        onClose={() => setShowAddSong(false)}
        defaultMoodId={mood.id}
        actor={actor}
        actorFetching={actorFetching}
        onSuccess={fetchCommunity}
      />
    </div>
  );
}

// ─── Mood Grid ──────────────────────────────────────────────────────────────────

interface MoodGridProps {
  onSelectMood: (mood: MoodData) => void;
  onScanVibe: () => void;
}

function MoodGrid({ onSelectMood, onScanVibe }: MoodGridProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{
            background: "linear-gradient(135deg, oklch(0.75 0.22 296), oklch(0.80 0.26 340), oklch(0.82 0.20 202))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          How are you feeling?
        </h1>
        <p className="text-muted-foreground mb-4">Pick your vibe and we'll play you the perfect songs.</p>

        {/* Scan My Vibe button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onScanVibe}
          data-ocid="face_scan.open_modal_button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, oklch(0.42 0.24 296 / 0.8), oklch(0.48 0.26 340 / 0.8))",
            border: "1px solid oklch(0.62 0.26 296 / 0.5)",
            color: "oklch(0.88 0.10 296)",
            boxShadow: "0 0 24px oklch(0.55 0.26 296 / 0.3)",
          }}
        >
          <Camera className="w-4 h-4" />
          Scan My Vibe 📸
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MOODS.map((mood, i) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 22 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMood(mood)}
            data-ocid={`vibe_listen.${mood.id}_button`}
            className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl text-center bg-gradient-to-br ${mood.gradient} cursor-pointer border border-white/10 overflow-hidden`}
            style={{
              boxShadow: `0 4px 20px ${mood.moodConfig.glowColor}`,
              transition: "all 0.2s ease",
            }}
          >
            {/* Glow orb */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${mood.moodConfig.textColor} 0%, transparent 70%)`,
              }}
            />
            <span className="text-4xl relative z-10">{mood.emoji}</span>
            <div className="relative z-10">
              <p className="font-bold text-sm" style={{ color: mood.moodConfig.textColor }}>{mood.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{mood.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Login Prompt ───────────────────────────────────────────────────────────────

function LoginPrompt() {
  const { login, isLoggingIn } = useInternetIdentity();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-5xl mb-4">🎵</div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{
            background: "linear-gradient(135deg, oklch(0.75 0.22 296), oklch(0.80 0.26 340))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Login to Vibe Listen
        </h2>
        <p className="text-muted-foreground text-sm mb-6">Access mood-based music, curated just for you.</p>
        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="font-semibold px-8"
          style={{
            background: "linear-gradient(135deg, oklch(0.55 0.26 296), oklch(0.62 0.28 340))",
            color: "white",
            border: "none",
          }}
        >
          {isLoggingIn ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</> : "Login to Continue"}
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function VibeListenPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor() as { actor: BackendActor | null; isFetching: boolean };
  const [selectedMood, setSelectedMood] = useState<MoodData | null>(null);
  const [showFaceScan, setShowFaceScan] = useState(false);

  const handleMoodDetected = (moodId: string) => {
    const found = MOODS.find((m) => m.id === moodId);
    if (found) setSelectedMood(found);
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
          <Music2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!identity) return <LoginPrompt />;

  return (
    <>
      <AnimatePresence mode="wait">
        {selectedMood ? (
          <motion.div
            key={`mood-${selectedMood.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <SongListView
              mood={selectedMood}
              actor={actor}
              actorFetching={actorFetching}
              identity={identity}
              onBack={() => setSelectedMood(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="mood-grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <MoodGrid
              onSelectMood={setSelectedMood}
              onScanVibe={() => setShowFaceScan(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <FaceScanModal
        open={showFaceScan}
        onClose={() => setShowFaceScan(false)}
        onMoodDetected={handleMoodDetected}
      />
    </>
  );
}
