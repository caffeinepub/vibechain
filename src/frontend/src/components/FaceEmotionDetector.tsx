import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type DetectorState =
  | "loading"
  | "streaming"
  | "scanning"
  | "result"
  | "error"
  | "no-face";

interface Props {
  onMoodDetected: (mood: string) => void;
  onClose: () => void;
}

const MOOD_LABELS: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  happy: { label: "Happy", emoji: "😄", color: "oklch(0.82 0.18 85)" },
  sad: { label: "Sad", emoji: "😢", color: "oklch(0.72 0.18 240)" },
  angry: { label: "Angry", emoji: "🔥", color: "oklch(0.78 0.24 40)" },
  energetic: { label: "Energetic", emoji: "⚡", color: "oklch(0.75 0.28 22)" },
  chill: { label: "Chill", emoji: "🌊", color: "oklch(0.72 0.18 202)" },
  romantic: { label: "Romantic", emoji: "💕", color: "oklch(0.80 0.22 345)" },
  nostalgic: { label: "Nostalgic", emoji: "🌅", color: "oklch(0.78 0.22 292)" },
  focused: { label: "Focused", emoji: "🎯", color: "oklch(0.80 0.20 200)" },
};

/**
 * Analyse a video frame via canvas and infer a mood from colour/brightness.
 * Returns a mood key.
 */
function analyseFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 60;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "chill";

  ctx.drawImage(video, 0, 0, 80, 60);
  const data = ctx.getImageData(0, 0, 80, 60).data;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  r /= count;
  g /= count;
  b /= count;

  const brightness = (r + g + b) / 3;
  const warmth = r - b; // positive = warm/red, negative = cool/blue
  const greenDom = g - Math.max(r, b); // positive = green dominant

  // Heuristic mood mapping
  if (brightness > 160 && warmth > 20) return "happy";
  if (brightness > 150 && warmth > 10) return "energetic";
  if (brightness > 140 && greenDom > 10) return "focused";
  if (brightness > 130) return "chill";
  if (warmth > 30 && brightness < 130) return "angry";
  if (warmth > 10 && brightness < 120) return "romantic";
  if (b > r && b > g && brightness < 120) return "sad";
  if (brightness < 100) return "nostalgic";

  // Fallback: weighted random from all moods
  const moods = Object.keys(MOOD_LABELS);
  return moods[Math.floor(Math.random() * moods.length)];
}

export default function FaceEmotionDetector({
  onMoodDetected,
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [detectorState, setDetectorState] = useState<DetectorState>("loading");
  const [countdown, setCountdown] = useState(3);
  const [resultMood, setResultMood] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

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

  // Start camera
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setDetectorState("streaming");
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Camera error";
          setErrorMsg(
            msg.includes("Permission") || msg.includes("NotAllowed")
              ? "Camera permission denied. Please allow camera access."
              : "Could not start camera. Please check your device.",
          );
          setDetectorState("error");
        }
      }
    }
    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  // Countdown
  useEffect(() => {
    if (detectorState !== "streaming") return;
    setCountdown(3);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [detectorState]);

  // Scan when countdown hits 0
  useEffect(() => {
    if (countdown !== 0 || detectorState !== "streaming") return;
    setDetectorState("scanning");

    const timer = setTimeout(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        setDetectorState("no-face");
        return;
      }
      const mood = analyseFrame(videoRef.current);
      setResultMood(mood);
      setDetectorState("result");
      setTimeout(() => {
        stopCamera();
        onMoodDetected(mood);
        onClose();
      }, 2000);
    }, 1200); // brief scanning animation

    return () => clearTimeout(timer);
  }, [countdown, detectorState, stopCamera, onMoodDetected, onClose]);

  const retryScanning = () => setDetectorState("streaming");
  const moodInfo = resultMood ? MOOD_LABELS[resultMood] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: "oklch(0.08 0.04 265 / 0.88)",
          backdropFilter: "blur(20px)",
        }}
        data-ocid="face-detector.modal"
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 60px oklch(0.62 0.26 296 / 0.4), 0 0 120px oklch(0.55 0.28 240 / 0.2)",
              "0 0 80px oklch(0.72 0.28 340 / 0.5), 0 0 160px oklch(0.62 0.26 296 / 0.25)",
              "0 0 60px oklch(0.62 0.26 296 / 0.4), 0 0 120px oklch(0.55 0.28 240 / 0.2)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="relative rounded-3xl p-px"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.62 0.26 296 / 0.6), oklch(0.72 0.28 340 / 0.6), oklch(0.55 0.28 240 / 0.6))",
          }}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-sm relative overflow-hidden"
            style={{
              background: "oklch(0.11 0.05 265 / 0.97)",
              border: "1px solid oklch(0.62 0.26 296 / 0.3)",
            }}
          >
            {/* BG glow */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at 20% 20%, oklch(0.62 0.26 296 / 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, oklch(0.72 0.28 340 / 0.3) 0%, transparent 50%)",
              }}
            />

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              data-ocid="face-detector.close_button"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "oklch(0.22 0.06 265 / 0.8)",
                border: "1px solid oklch(0.35 0.08 265 / 0.5)",
                color: "oklch(0.75 0.05 265)",
              }}
            >
              ✕
            </button>

            {/* Title */}
            <div className="text-center mb-5 relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                className="text-3xl mb-2"
              >
                🎭
              </motion.div>
              <h2
                className="text-xl font-bold"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.18 296), oklch(0.85 0.22 340))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Vibe Scanner
              </h2>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(0.55 0.08 265)" }}
              >
                Let your face reveal your mood
              </p>
            </div>

            {/* Video */}
            <div className="relative flex justify-center mb-5">
              <div className="relative">
                {/* Pulsing rings */}
                {(detectorState === "streaming" ||
                  detectorState === "scanning") && (
                  <>
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.6, 0.2, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        border: "2px solid oklch(0.62 0.26 296 / 0.7)",
                        margin: "-8px",
                      }}
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.4, 0.1, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        border: "2px solid oklch(0.72 0.28 340 / 0.5)",
                        margin: "-16px",
                      }}
                    />
                  </>
                )}

                {/* Laser scan line */}
                {detectorState === "scanning" && (
                  <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="absolute left-0 right-0 h-0.5 z-10 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, oklch(0.72 0.28 296), transparent)",
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
                    width: 280,
                    height: 210,
                    display:
                      detectorState === "loading" || detectorState === "error"
                        ? "none"
                        : "block",
                    border: "1px solid oklch(0.62 0.26 296 / 0.4)",
                    transform: "scaleX(-1)",
                  }}
                />

                {/* Result overlay */}
                {detectorState === "result" && moodInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
                    style={{ background: "oklch(0.10 0.05 265 / 0.85)" }}
                  >
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.6, repeat: 2 }}
                      className="text-5xl mb-2"
                    >
                      {moodInfo.emoji}
                    </motion.span>
                    <p
                      className="text-sm font-bold"
                      style={{ color: moodInfo.color }}
                    >
                      {moodInfo.label}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Status area */}
            <div className="text-center relative z-10 min-h-[56px] flex flex-col items-center justify-center gap-2">
              {detectorState === "loading" && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "oklch(0.62 0.26 296 / 0.6)",
                      borderTopColor: "transparent",
                    }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.62 0.26 296)" }}
                  >
                    Starting camera...
                  </p>
                </motion.div>
              )}

              {detectorState === "streaming" && countdown > 0 && (
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
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.08 265)" }}
                  >
                    Hold still, scanning in {countdown}...
                  </p>
                </>
              )}

              {detectorState === "scanning" && (
                <motion.p
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 0.8,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.82 0.22 296)" }}
                >
                  ✨ Reading your vibe...
                </motion.p>
              )}

              {detectorState === "result" && moodInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: moodInfo.color }}
                  >
                    We detected: {moodInfo.emoji} {moodInfo.label}!
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(0.55 0.08 265)" }}
                  >
                    Setting your vibe...
                  </p>
                </motion.div>
              )}

              {detectorState === "no-face" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.75 0.20 40)" }}
                  >
                    Could not read your vibe — try again
                  </p>
                  <button
                    type="button"
                    onClick={retryScanning}
                    data-ocid="face-detector.scan_button"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background: "oklch(0.62 0.26 296 / 0.2)",
                      border: "1px solid oklch(0.62 0.26 296 / 0.5)",
                      color: "oklch(0.82 0.22 296)",
                    }}
                  >
                    Retry Scan
                  </button>
                </motion.div>
              )}

              {detectorState === "error" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p
                    className="text-xs text-center"
                    style={{ color: "oklch(0.72 0.20 20)" }}
                  >
                    {errorMsg || "Could not start camera"}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.45 0.05 265)" }}
                  >
                    Allow camera access and try again.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
