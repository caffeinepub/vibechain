import { createContext, useContext, useState } from "react";

interface MoodConfig {
  textColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  emoji: string;
  label: string;
}

interface SongInfo {
  title: string;
  artist: string;
}

export interface PlaylistSong {
  title: string;
  artist: string;
  videoId: string;
}

interface MiniPlayerContextValue {
  playingVideoId: string | null;
  playingSong: SongInfo | null;
  currentMoodConfig: MoodConfig | null;
  isPlaying: boolean;
  playSong: (
    videoId: string,
    song: SongInfo,
    moodConfig: MoodConfig,
    playlist?: PlaylistSong[],
    index?: number,
  ) => void;
  stopPlaying: () => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlayPause: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const MiniPlayerContext = createContext<MiniPlayerContextValue | null>(null);

export function MiniPlayerProvider({
  children,
}: { children: React.ReactNode }) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [playingSong, setPlayingSong] = useState<SongInfo | null>(null);
  const [currentMoodConfig, setCurrentMoodConfig] = useState<MoodConfig | null>(
    null,
  );
  const [playlist, setPlaylist] = useState<PlaylistSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const playSong = (
    videoId: string,
    song: SongInfo,
    moodConfig: MoodConfig,
    newPlaylist?: PlaylistSong[],
    index?: number,
  ) => {
    setPlayingVideoId(videoId);
    setPlayingSong(song);
    setCurrentMoodConfig(moodConfig);
    setIsPlaying(true);
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      setCurrentIndex(index ?? 0);
    }
  };

  const stopPlaying = () => {
    setPlayingVideoId(null);
    setPlayingSong(null);
    setCurrentMoodConfig(null);
    setPlaylist([]);
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const playNext = () => {
    if (!currentMoodConfig || currentIndex >= playlist.length - 1) return;
    const next = playlist[currentIndex + 1];
    setCurrentIndex(currentIndex + 1);
    setPlayingVideoId(next.videoId);
    setPlayingSong({ title: next.title, artist: next.artist });
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (!currentMoodConfig || currentIndex <= 0) return;
    const prev = playlist[currentIndex - 1];
    setCurrentIndex(currentIndex - 1);
    setPlayingVideoId(prev.videoId);
    setPlayingSong({ title: prev.title, artist: prev.artist });
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const hasNext = playlist.length > 0 && currentIndex < playlist.length - 1;
  const hasPrev = playlist.length > 0 && currentIndex > 0;

  return (
    <MiniPlayerContext.Provider
      value={{
        playingVideoId,
        playingSong,
        currentMoodConfig,
        isPlaying,
        playSong,
        stopPlaying,
        playNext,
        playPrev,
        togglePlayPause,
        hasNext,
        hasPrev,
      }}
    >
      {children}
    </MiniPlayerContext.Provider>
  );
}

export function useMiniPlayer() {
  const ctx = useContext(MiniPlayerContext);
  if (!ctx)
    throw new Error("useMiniPlayer must be used within MiniPlayerProvider");
  return ctx;
}
