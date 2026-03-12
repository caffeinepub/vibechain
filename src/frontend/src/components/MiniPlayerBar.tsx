import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useMiniPlayer } from "../context/MiniPlayerContext";

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

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Send play/pause commands to the YouTube iframe via postMessage
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const func = isPlaying ? "playVideo" : "pauseVideo";
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*",
    );
  }, [isPlaying]);

  return (
    <AnimatePresence>
      {playingVideoId && playingSong && currentMoodConfig && (
        <motion.div
          key="mini-player"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          data-ocid="mini-player.bar"
          className="fixed bottom-0 left-0 right-0 z-50 glass-card"
          style={{
            borderTop: `1px solid ${currentMoodConfig.borderColor}`,
            boxShadow: `0 -4px 32px ${currentMoodConfig.glowColor}, 0 -1px 0 ${currentMoodConfig.borderColor}`,
          }}
        >
          {/* Hidden YouTube iframe with JS API enabled */}
          <iframe
            ref={iframeRef}
            key={playingVideoId}
            src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1&controls=0&rel=0&modestbranding=1&enablejsapi=1`}
            title="mini-player-audio"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
              bottom: 0,
              left: 0,
            }}
          />

          <div className="flex items-center gap-3 px-4 h-[72px] max-w-6xl mx-auto">
            {/* Thumbnail */}
            <div
              className="flex-shrink-0 relative rounded-lg overflow-hidden"
              style={{ width: 48, height: 36 }}
            >
              <img
                src={`https://img.youtube.com/vi/${playingVideoId}/mqdefault.jpg`}
                alt={playingSong.title}
                className="w-full h-full object-cover"
              />
              {/* Pulsing overlay when playing */}
              <motion.div
                animate={
                  isPlaying ? { opacity: [0.6, 0.9, 0.6] } : { opacity: 0.85 }
                }
                transition={{
                  duration: 1.2,
                  repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `${currentMoodConfig.bgColor}` }}
              >
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{
                    duration: 1.2,
                    repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut",
                  }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: currentMoodConfig.textColor }}
                />
              </motion.div>
            </div>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate leading-tight"
                style={{ color: currentMoodConfig.textColor }}
              >
                {playingSong.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {playingSong.artist}
              </p>
            </div>

            {/* Mood badge */}
            <span
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0"
              style={{
                background: currentMoodConfig.bgColor,
                color: currentMoodConfig.textColor,
                border: `1px solid ${currentMoodConfig.borderColor}`,
              }}
            >
              <span>{currentMoodConfig.emoji}</span>
              <span>{currentMoodConfig.label}</span>
            </span>

            {/* Now playing label */}
            <span
              className="hidden md:block text-xs font-bold uppercase tracking-widest opacity-60 flex-shrink-0"
              style={{ color: currentMoodConfig.textColor }}
            >
              {isPlaying ? "Now Playing" : "Paused"}
            </span>

            {/* Prev control */}
            <button
              type="button"
              onClick={playPrev}
              disabled={!hasPrev}
              data-ocid="mini-player.prev_button"
              aria-label="Previous track"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              style={{
                color: hasPrev ? currentMoodConfig.textColor : undefined,
                opacity: hasPrev ? 1 : 0.4,
                cursor: hasPrev ? "pointer" : "not-allowed",
              }}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause */}
            <button
              type="button"
              onClick={togglePlayPause}
              data-ocid="mini-player.toggle"
              aria-label={isPlaying ? "Pause" : "Play"}
              className="p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              style={{ color: currentMoodConfig.textColor }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            {/* Next control */}
            <button
              type="button"
              onClick={playNext}
              disabled={!hasNext}
              data-ocid="mini-player.next_button"
              aria-label="Next track"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              style={{
                color: hasNext ? currentMoodConfig.textColor : undefined,
                opacity: hasNext ? 1 : 0.4,
                cursor: hasNext ? "pointer" : "not-allowed",
              }}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={stopPlaying}
              data-ocid="mini-player.close_button"
              className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-1"
              aria-label="Stop playing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
