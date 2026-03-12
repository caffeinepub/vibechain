import { r as reactExports, j as jsxRuntimeExports, A as AnimatePresence, m as motion } from "./index-DAFygBXC.js";
const MOOD_LABELS = {
  happy: { label: "Happy", emoji: "😄", color: "oklch(0.82 0.18 85)" },
  sad: { label: "Sad", emoji: "😢", color: "oklch(0.72 0.18 240)" },
  angry: { label: "Angry", emoji: "🔥", color: "oklch(0.78 0.24 40)" },
  energetic: { label: "Energetic", emoji: "⚡", color: "oklch(0.75 0.28 22)" },
  chill: { label: "Chill", emoji: "🌊", color: "oklch(0.72 0.18 202)" },
  romantic: { label: "Romantic", emoji: "💕", color: "oklch(0.80 0.22 345)" },
  nostalgic: { label: "Nostalgic", emoji: "🌅", color: "oklch(0.78 0.22 292)" },
  focused: { label: "Focused", emoji: "🎯", color: "oklch(0.80 0.20 200)" }
};
function analyseFrame(video) {
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
  const warmth = r - b;
  const greenDom = g - Math.max(r, b);
  if (brightness > 160 && warmth > 20) return "happy";
  if (brightness > 150 && warmth > 10) return "energetic";
  if (brightness > 140 && greenDom > 10) return "focused";
  if (brightness > 130) return "chill";
  if (warmth > 30 && brightness < 130) return "angry";
  if (warmth > 10 && brightness < 120) return "romantic";
  if (b > r && b > g && brightness < 120) return "sad";
  if (brightness < 100) return "nostalgic";
  const moods = Object.keys(MOOD_LABELS);
  return moods[Math.floor(Math.random() * moods.length)];
}
function FaceEmotionDetector({
  onMoodDetected,
  onClose
}) {
  const videoRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const [detectorState, setDetectorState] = reactExports.useState("loading");
  const [countdown, setCountdown] = reactExports.useState(3);
  const [resultMood, setResultMood] = reactExports.useState(null);
  const [errorMsg, setErrorMsg] = reactExports.useState("");
  const stopCamera = reactExports.useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);
  const handleClose = reactExports.useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);
  reactExports.useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
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
            msg.includes("Permission") || msg.includes("NotAllowed") ? "Camera permission denied. Please allow camera access." : "Could not start camera. Please check your device."
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
  reactExports.useEffect(() => {
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
    }, 1e3);
    return () => clearInterval(iv);
  }, [detectorState]);
  reactExports.useEffect(() => {
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
      }, 2e3);
    }, 1200);
    return () => clearTimeout(timer);
  }, [countdown, detectorState, stopCamera, onMoodDetected, onClose]);
  const retryScanning = () => setDetectorState("streaming");
  const moodInfo = resultMood ? MOOD_LABELS[resultMood] : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "fixed inset-0 z-50 flex items-center justify-center",
      style: {
        background: "oklch(0.08 0.04 265 / 0.88)",
        backdropFilter: "blur(20px)"
      },
      "data-ocid": "face-detector.modal",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          animate: {
            boxShadow: [
              "0 0 60px oklch(0.62 0.26 296 / 0.4), 0 0 120px oklch(0.55 0.28 240 / 0.2)",
              "0 0 80px oklch(0.72 0.28 340 / 0.5), 0 0 160px oklch(0.62 0.26 296 / 0.25)",
              "0 0 60px oklch(0.62 0.26 296 / 0.4), 0 0 120px oklch(0.55 0.28 240 / 0.2)"
            ]
          },
          transition: {
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          },
          className: "relative rounded-3xl p-px",
          style: {
            background: "linear-gradient(135deg, oklch(0.62 0.26 296 / 0.6), oklch(0.72 0.28 340 / 0.6), oklch(0.55 0.28 240 / 0.6))"
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "rounded-3xl p-6 w-full max-w-sm relative overflow-hidden",
              style: {
                background: "oklch(0.11 0.05 265 / 0.97)",
                border: "1px solid oklch(0.62 0.26 296 / 0.3)"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "absolute inset-0 pointer-events-none opacity-20",
                    style: {
                      background: "radial-gradient(ellipse at 20% 20%, oklch(0.62 0.26 296 / 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, oklch(0.72 0.28 340 / 0.3) 0%, transparent 50%)"
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleClose,
                    "data-ocid": "face-detector.close_button",
                    className: "absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110",
                    style: {
                      background: "oklch(0.22 0.06 265 / 0.8)",
                      border: "1px solid oklch(0.35 0.08 265 / 0.5)",
                      color: "oklch(0.75 0.05 265)"
                    },
                    children: "✕"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-5 relative z-10", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    motion.div,
                    {
                      animate: { rotate: [0, 10, -10, 0] },
                      transition: { duration: 4, repeat: Number.POSITIVE_INFINITY },
                      className: "text-3xl mb-2",
                      children: "🎭"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "h2",
                    {
                      className: "text-xl font-bold",
                      style: {
                        background: "linear-gradient(135deg, oklch(0.82 0.18 296), oklch(0.85 0.22 340))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                      },
                      children: "Vibe Scanner"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      className: "text-xs mt-1",
                      style: { color: "oklch(0.55 0.08 265)" },
                      children: "Let your face reveal your mood"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative flex justify-center mb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  (detectorState === "streaming" || detectorState === "scanning") && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      motion.div,
                      {
                        animate: {
                          scale: [1, 1.15, 1],
                          opacity: [0.6, 0.2, 0.6]
                        },
                        transition: {
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        },
                        className: "absolute inset-0 rounded-2xl pointer-events-none",
                        style: {
                          border: "2px solid oklch(0.62 0.26 296 / 0.7)",
                          margin: "-8px"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      motion.div,
                      {
                        animate: {
                          scale: [1, 1.25, 1],
                          opacity: [0.4, 0.1, 0.4]
                        },
                        transition: {
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: 0.5
                        },
                        className: "absolute inset-0 rounded-2xl pointer-events-none",
                        style: {
                          border: "2px solid oklch(0.72 0.28 340 / 0.5)",
                          margin: "-16px"
                        }
                      }
                    )
                  ] }),
                  detectorState === "scanning" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    motion.div,
                    {
                      animate: { top: ["0%", "100%", "0%"] },
                      transition: {
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear"
                      },
                      className: "absolute left-0 right-0 h-0.5 z-10 pointer-events-none",
                      style: {
                        background: "linear-gradient(90deg, transparent, oklch(0.72 0.28 296), transparent)",
                        boxShadow: "0 0 8px oklch(0.72 0.28 296)"
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "video",
                    {
                      ref: videoRef,
                      muted: true,
                      playsInline: true,
                      className: "rounded-2xl object-cover",
                      style: {
                        width: 280,
                        height: 210,
                        display: detectorState === "loading" || detectorState === "error" ? "none" : "block",
                        border: "1px solid oklch(0.62 0.26 296 / 0.4)",
                        transform: "scaleX(-1)"
                      }
                    }
                  ),
                  detectorState === "result" && moodInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0, scale: 0.8 },
                      animate: { opacity: 1, scale: 1 },
                      className: "absolute inset-0 rounded-2xl flex flex-col items-center justify-center",
                      style: { background: "oklch(0.10 0.05 265 / 0.85)" },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          motion.span,
                          {
                            animate: { scale: [1, 1.3, 1] },
                            transition: { duration: 0.6, repeat: 2 },
                            className: "text-5xl mb-2",
                            children: moodInfo.emoji
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: "text-sm font-bold",
                            style: { color: moodInfo.color },
                            children: moodInfo.label
                          }
                        )
                      ]
                    }
                  )
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center relative z-10 min-h-[56px] flex flex-col items-center justify-center gap-2", children: [
                  detectorState === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    motion.div,
                    {
                      animate: { opacity: [0.5, 1, 0.5] },
                      transition: {
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY
                      },
                      className: "flex flex-col items-center gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "w-8 h-8 rounded-full border-2 animate-spin",
                            style: {
                              borderColor: "oklch(0.62 0.26 296 / 0.6)",
                              borderTopColor: "transparent"
                            }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: "text-sm",
                            style: { color: "oklch(0.62 0.26 296)" },
                            children: "Starting camera..."
                          }
                        )
                      ]
                    }
                  ),
                  detectorState === "streaming" && countdown > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      motion.div,
                      {
                        initial: { scale: 1.8, opacity: 0 },
                        animate: { scale: 1, opacity: 1 },
                        className: "text-4xl font-black",
                        style: { color: "oklch(0.82 0.26 296)" },
                        children: countdown
                      },
                      countdown
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "p",
                      {
                        className: "text-xs",
                        style: { color: "oklch(0.55 0.08 265)" },
                        children: [
                          "Hold still, scanning in ",
                          countdown,
                          "..."
                        ]
                      }
                    )
                  ] }),
                  detectorState === "scanning" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    motion.p,
                    {
                      animate: { opacity: [0.6, 1, 0.6] },
                      transition: {
                        duration: 0.8,
                        repeat: Number.POSITIVE_INFINITY
                      },
                      className: "text-sm font-semibold",
                      style: { color: "oklch(0.82 0.22 296)" },
                      children: "✨ Reading your vibe..."
                    }
                  ),
                  detectorState === "result" && moodInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0 },
                      className: "text-center",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "p",
                          {
                            className: "text-sm font-bold",
                            style: { color: moodInfo.color },
                            children: [
                              "We detected: ",
                              moodInfo.emoji,
                              " ",
                              moodInfo.label,
                              "!"
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: "text-xs mt-1",
                            style: { color: "oklch(0.55 0.08 265)" },
                            children: "Setting your vibe..."
                          }
                        )
                      ]
                    }
                  ),
                  detectorState === "no-face" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      className: "flex flex-col items-center gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: "text-sm",
                            style: { color: "oklch(0.75 0.20 40)" },
                            children: "Could not read your vibe — try again"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: retryScanning,
                            "data-ocid": "face-detector.scan_button",
                            className: "px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105",
                            style: {
                              background: "oklch(0.62 0.26 296 / 0.2)",
                              border: "1px solid oklch(0.62 0.26 296 / 0.5)",
                              color: "oklch(0.82 0.22 296)"
                            },
                            children: "Retry Scan"
                          }
                        )
                      ]
                    }
                  ),
                  detectorState === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      className: "flex flex-col items-center gap-3",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: "text-xs text-center",
                            style: { color: "oklch(0.72 0.20 20)" },
                            children: errorMsg || "Could not start camera"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: "text-xs",
                            style: { color: "oklch(0.45 0.05 265)" },
                            children: "Allow camera access and try again."
                          }
                        )
                      ]
                    }
                  )
                ] })
              ]
            }
          )
        }
      )
    }
  ) });
}
export {
  FaceEmotionDetector as default
};
