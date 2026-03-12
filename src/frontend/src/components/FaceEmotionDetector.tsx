import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
const FACE_API_CDN =
  "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";

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

interface FaceExpressions {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  [key: string]: number;
}

interface FaceApiLib {
  nets: {
    tinyFaceDetector: { loadFromUri: (uri: string) => Promise<void> };
    faceExpressionNet: { loadFromUri: (uri: string) => Promise<void> };
  };
  TinyFaceDetectorOptions: new (opts?: {
    inputSize?: number;
    scoreThreshold?: number;
  }) => unknown;
  detectSingleFace: (
    input: HTMLVideoElement,
    options: unknown,
  ) => {
    withFaceExpressions: () => Promise<
      { expressions: FaceExpressions } | undefined
    >;
  };
}

declare global {
  interface Window {
    faceapi?: FaceApiLib;
  }
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
  nostalgic: {
    label: "Nostalgic",
    emoji: "🌅",
    color: "oklch(0.78 0.22 292)",
  },
  focused: { label: "Focused", emoji: "🎯", color: "oklch(0.80 0.20 200)" },
};

function expressionToMood(expressions: FaceExpressions): {
  mood: string;
  confidence: number;
} {
  const entries = [
    { key: "happy", mood: "happy" },
    { key: "sad", mood: "sad" },
    { key: "angry", mood: "angry" },
    { key: "surprised", mood: "energetic" },
    { key: "fearful", mood: "nostalgic" },
    { key: "disgusted", mood: "angry" },
    { key: "neutral", mood: "chill" },
  ] as const;

  let topExpression = "neutral";
  let topScore = 0;

  for (const { key } of entries) {
    const score = expressions[key] as number;
    if (score > topScore) {
      topScore = score;
      topExpression = key;
    }
  }

  const mapped = entries.find((e) => e.key === topExpression);
  return {
    mood: mapped ? mapped.mood : "chill",
    confidence: Math.round(topScore * 100),
  };
}

let modelsLoaded = false;
let scriptLoading: Promise<void> | null = null;

function loadFaceApiScript(): Promise<void> {
  if (window.faceapi) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${FACE_API_CDN}"]`);
    if (existing) {
      const check = setInterval(() => {
        if (window.faceapi) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }
    const script = document.createElement("script");
    script.src = FACE_API_CDN;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load face-api.js"));
    document.head.appendChild(script);
  });
  return scriptLoading;
}

export default function FaceEmotionDetector({
  onMoodDetected,
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [detectorState, setDetectorState] = useState<DetectorState>("loading");
  const [resultMood, setResultMood] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("Loading AI models...");

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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!modelsLoaded) {
        try {
          setLoadingMsg("Loading AI models...");
          await loadFaceApiScript();
          const faceapi = window.faceapi;
          if (!faceapi) throw new Error("face-api.js not available");
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          ]);
          modelsLoaded = true;
        } catch {
          if (!cancelled) {
            setErrorMsg(
              "Failed to load face detection models. Check your connection.",
            );
            setDetectorState("error");
          }
          return;
        }
      }

      if (cancelled) return;

      setLoadingMsg("Starting camera...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
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

  const runScan = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      setDetectorState("no-face");
      return;
    }

    setDetectorState("scanning");
    const faceapi = window.faceapi;
    if (!faceapi) {
      setDetectorState("no-face");
      return;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions(),
        )
        .withFaceExpressions();

      if (!detection) {
        setDetectorState("no-face");
        return;
      }

      const { mood, confidence: conf } = expressionToMood(
        detection.expressions,
      );
      setResultMood(mood);
      setConfidence(conf);
      setDetectorState("result");
    } catch {
      setDetectorState("no-face");
    }
  }, []);

  const applyMood = useCallback(() => {
    if (resultMood) {
      stopCamera();
      onMoodDetected(resultMood);
      onClose();
    }
  }, [resultMood, stopCamera, onMoodDetected, onClose]);

  const retryScanning = () => {
    setResultMood(null);
    setConfidence(0);
    setDetectorState("streaming");
  };

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
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at 20% 20%, oklch(0.62 0.26 296 / 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, oklch(0.72 0.28 340 / 0.3) 0%, transparent 50%)",
              }}
            />

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

            <div className="relative flex justify-center mb-5">
              <div className="relative">
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

            <div className="text-center relative z-10 min-h-[80px] flex flex-col items-center justify-center gap-3">
              {detectorState === "loading" && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="flex flex-col items-center gap-2"
                  data-ocid="face-detector.loading_state"
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
                    {loadingMsg}
                  </p>
                </motion.div>
              )}

              {detectorState === "streaming" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.08 265)" }}
                  >
                    Position your face in the frame
                  </p>
                  <button
                    type="button"
                    onClick={runScan}
                    data-ocid="face-detector.scan_button"
                    className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.62 0.26 296 / 0.85), oklch(0.72 0.28 340 / 0.85))",
                      border: "1px solid oklch(0.72 0.28 296 / 0.5)",
                      color: "oklch(0.98 0.01 265)",
                      boxShadow: "0 0 20px oklch(0.62 0.26 296 / 0.3)",
                    }}
                  >
                    ✨ Scan My Vibe
                  </button>
                </motion.div>
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
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: moodInfo.color }}
                  >
                    {moodInfo.emoji} {moodInfo.label} detected!
                  </p>
                  <div className="w-full max-w-[200px]">
                    <div
                      className="flex justify-between text-xs mb-1"
                      style={{ color: "oklch(0.55 0.08 265)" }}
                    >
                      <span>Confidence</span>
                      <span style={{ color: moodInfo.color }}>
                        {confidence}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ background: "oklch(0.22 0.06 265 / 0.6)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${moodInfo.color}, oklch(0.82 0.22 340))`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={applyMood}
                      data-ocid="face-detector.apply_button"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.62 0.26 296 / 0.85), oklch(0.72 0.28 340 / 0.85))",
                        border: "1px solid oklch(0.72 0.28 296 / 0.5)",
                        color: "oklch(0.98 0.01 265)",
                        boxShadow: "0 0 16px oklch(0.62 0.26 296 / 0.3)",
                      }}
                    >
                      Apply this Vibe
                    </button>
                    <button
                      type="button"
                      onClick={retryScanning}
                      data-ocid="face-detector.secondary_button"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                      style={{
                        background: "oklch(0.22 0.06 265 / 0.6)",
                        border: "1px solid oklch(0.35 0.08 265 / 0.5)",
                        color: "oklch(0.65 0.08 265)",
                      }}
                    >
                      Scan Again
                    </button>
                  </div>
                </motion.div>
              )}

              {detectorState === "no-face" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                  data-ocid="face-detector.error_state"
                >
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.75 0.20 40)" }}
                  >
                    No face detected, try again
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
                  data-ocid="face-detector.error_state"
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
