// Re-export from unified music utils for backward compatibility
export {
  parseYouTubeId,
  parseVibeMessage as _parseVibeMessage,
  encodeMusicMessage as encodeVibeMessage,
} from "./music";
import { parseVibeMessage as _parse } from "./music";

/** Legacy shim: returns { videoId, text } */
export function parseVibeMessage(message: string | undefined | null): {
  videoId: string | null;
  text: string;
} {
  const result = _parse(message);
  return {
    videoId: result.music?.kind === "youtube" ? result.music.videoId : null,
    text: result.text,
  };
}
