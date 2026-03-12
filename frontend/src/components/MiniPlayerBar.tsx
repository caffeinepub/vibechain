import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMiniPlayer } from "../context/MiniPlayerContext";

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(id: string): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoLoadedFraction(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MiniPlayerBar() {
  const {
    playingVideoId,
    playingSong,
    currentMoodConfig,
    isPlaying,
    stopPlaying,
    playNext,
    playPrev,
    togglePlayPause,
    hasNext,
    hasPrev,
  } = useMiniPlayer();

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const durationRef = useRef(0);
  durationRef.current = duration;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const playNextRef = useRef(playNext);
  playNextRef.current = playNext;
  const hasNextRef = useRef(hasNext);
  hasNextRef.current = hasNext;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const cur = p.getCurrentTime();
        const dur = p.getDuration();
        const buf = p.getVideoLoadedFraction();
        setCurrentTime(cur);
        setDuration(dur);
        setProgress(dur > 0 ? cur / dur : 0);
        setBuffered(buf);
      } catch (_) {
        // ignore
      }
    }, 500);
  }, [stopPolling]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      const p = playerRef.current;
      const dur = durationRef.current;
      if (!bar || !p || dur <= 0) return;
      const rect = bar.getBoundingClientRect();
      let clientX: number;
      if ("touches" in e) {
        clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      } else {
        clientX = e.clientX;
      }
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      try {
        p.seekTo(ratio * dur, true);
        setProgress(ratio);
        setCurrentTime(ratio * dur);
      } catch (_) {
        /* ignore */
      }
    },
    [],
  );

  const handleBarMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(ratio);
  }, []);

  // Load YT API once
  useEffect(() => {
    if (window.YT) return;
    if (document.getElementById("yt-iframe-api-script")) return;
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  // Create/recreate player when videoId changes
  useEffect(() => {
    if (!playingVideoId || !playerContainerRef.current) return;

    setProgress(0);
    setBuffered(0);
    setCurrentTime(0);
    setDuration(0);

    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (_) { /* ignore */ }
      playerRef.current = null;
    }
    stopPolling();

    const container = playerContainerRef.current;
    container.innerHTML = "";
    const div = document.createElement("div");
    div.id = `yt-player-${playingVideoId}`;
    container.appendChild(div);

    const createPlayer = () => {
      playerRef.current = new window.YT.Player(div, {
        videoId: playingVideoId,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            if (isPlayingRef.current) e.target.playVideo();
            startPolling();
          },
          onStateChange: (e) => {
            if (e.data === 0 && hasNextRef.current) playNextRef.current();
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    return () => { stopPolling(); };
  }, [playingVideoId, startPolling, stopPolling]);

  // Sync play/pause
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (isPlaying) { p.playVideo(); startPolling(); }
      else { p.pauseVideo(); stopPolling(); }
    } catch (_) { /* ignore */ }
  }, [isPlaying, startPolling, stopPolling]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
      try { playerRef.current?.destroy(); } catch (_) { /* ignore */ }
    };
  }, [stopPolling]);

  if (!playingVideoId || !playingSong || !currentMoodConfig) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="mini-player"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        data-ocid="mini_player.panel"
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "oklch(0.10 0.05 265 / 0.96)",
          backdropFilter: "blur(24px)",
          borderTop: `1px solid ${currentMoodConfig.borderColor}`,
          boxShadow: `0 -4px 40px ${currentMoodConfig.glowColor}, 0 -1px 0 ${currentMoodConfig.borderColor}`,
        }}
      >
        {/* Seekable progress bar */}
        <div
          ref={progressBarRef}
          className="absolute top-0 left-0 right-0 overflow-hidden"
          style={{ height: 5, cursor: duration > 0 ? "pointer" : "default", zIndex: 10 }}
          onClick={handleSeek}
          onTouchEnd={handleSeek}
          onMouseMove={handleBarMouseMove}
          onMouseLeave={() => setHoverPos(null)}
          tabIndex={0}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={(e) => {
            if (!playerRef.current || durationRef.current <= 0) return;
            const step = 0.05;
            if (e.key === "ArrowRight") {
              const next = Math.min(1, progress + step);
              playerRef.current.seekTo(next * durationRef.current, true);
              setProgress(next);
            }
            if (e.key === "ArrowLeft") {
              const next = Math.max(0, progress - step);
              playerRef.current.seekTo(next * durationRef.current, true);
              setProgress(next);
            }
          }}
        >
          {/* Buffer */}
          <div
            className="absolute top-0 left-0 h-full"
            style={{ width: `${buffered * 100}%`, background: currentMoodConfig.textColor, opacity: 0.22, transition: "width 0.4s ease" }}
          />
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${currentMoodConfig.textColor}, ${currentMoodConfig.glowColor})`,
              boxShadow: `0 0 8px ${currentMoodConfig.glowColor}`,
              transition: "width 0.5s linear",
            }}
          />
          {/* Hover preview */}
          {hoverPos !== null && duration > 0 && (
            <div
              className="absolute -top-7 text-xs px-1.5 py-0.5 rounded pointer-events-none font-mono"
              style={{
                left: `clamp(0px, calc(${hoverPos * 100}% - 18px), calc(100% - 36px))`,
                background: currentMoodConfig.bgColor,
                color: currentMoodConfig.textColor,
                border: `1px solid ${currentMoodConfig.borderColor}`,
                fontSize: 10,
              }}
            >
              {formatTime(hoverPos * duration)}
            </div>
          )}
        </div>

        {/* Hidden YT player */}
        <div
          ref={playerContainerRef}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none", bottom: 0, left: 0, overflow: "hidden" }}
        />

        <div className="flex items-center gap-3 px-4 h-[68px] max-w-5xl mx-auto">
          {/* Thumbnail */}
          <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 46, height: 34 }}>
            <img
              src={`https://img.youtube.com/vi/${playingVideoId}/mqdefault.jpg`}
              alt={playingSong.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: currentMoodConfig.textColor }}>
              {playingSong.title}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{playingSong.artist}</p>
            {duration > 0 && (
              <p className="text-xs tabular-nums" style={{ color: currentMoodConfig.textColor, opacity: 0.55 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            )}
          </div>

          {/* Mood badge */}
          <span
            className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
            style={{ background: currentMoodConfig.bgColor, color: currentMoodConfig.textColor, border: `1px solid ${currentMoodConfig.borderColor}` }}
          >
            {currentMoodConfig.emoji} {currentMoodConfig.label}
          </span>

          {/* Prev */}
          <button
            type="button"
            onClick={playPrev}
            disabled={!hasPrev}
            data-ocid="mini_player.prev_button"
            aria-label="Previous track"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: currentMoodConfig.textColor }}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlayPause}
            data-ocid="mini_player.toggle"
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 transition-all flex-shrink-0"
            style={{ background: currentMoodConfig.bgColor, border: `1px solid ${currentMoodConfig.borderColor}`, color: currentMoodConfig.textColor }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={playNext}
            disabled={!hasNext}
            data-ocid="mini_player.next_button"
            aria-label="Next track"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: currentMoodConfig.textColor }}
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={stopPlaying}
            data-ocid="mini_player.close_button"
            aria-label="Stop playing"
            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
