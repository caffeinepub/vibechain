/**
 * Unified music URL parser for YouTube and Spotify.
 */

// ─── YouTube ───────────────────────────────────────────────────────────────

export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return isValidYtId(id) ? id : null;
    }
    if (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "music.youtube.com" ||
      u.hostname === "m.youtube.com"
    ) {
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shortsMatch)
        return isValidYtId(shortsMatch[1]) ? shortsMatch[1] : null;
      const v = u.searchParams.get("v");
      if (v && isValidYtId(v)) return v;
    }
    return null;
  } catch {
    return null;
  }
}

function isValidYtId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

// ─── Spotify ──────────────────────────────────────────────────────────────

export type SpotifyType = "track" | "album" | "playlist";

export interface SpotifyRef {
  type: SpotifyType;
  id: string;
}

export function parseSpotifyRef(url: string): SpotifyRef | null {
  try {
    const u = new URL(url);
    if (u.hostname === "open.spotify.com" || u.hostname === "spotify.com") {
      const match = u.pathname.match(
        /^\/(track|album|playlist)\/([A-Za-z0-9]+)/,
      );
      if (match) return { type: match[1] as SpotifyType, id: match[2] };
    }
    return null;
  } catch {
    // Handle spotify:track:ID URIs
    const uriMatch = url.match(
      /^spotify:(track|album|playlist):([A-Za-z0-9]+)$/,
    );
    if (uriMatch) return { type: uriMatch[1] as SpotifyType, id: uriMatch[2] };
    return null;
  }
}

export function spotifyEmbedUrl(ref: SpotifyRef): string {
  return `https://open.spotify.com/embed/${ref.type}/${ref.id}?utm_source=generator&theme=0`;
}

// ─── Unified parse ─────────────────────────────────────────────────────────

export type MusicRef =
  | { kind: "youtube"; videoId: string }
  | { kind: "spotify"; ref: SpotifyRef }
  | null;

export function parseMusicUrl(url: string): MusicRef {
  const ytId = parseYouTubeId(url);
  if (ytId) return { kind: "youtube", videoId: ytId };
  const spRef = parseSpotifyRef(url);
  if (spRef) return { kind: "spotify", ref: spRef };
  return null;
}

// ─── Message encoding ─────────────────────────────────────────────────────
// Format: [yt:VIDEO_ID] or [sp:track/ID] prepended to free text.

const YT_RE = /^\[yt:([a-zA-Z0-9_-]{11})\]/;
const SP_RE = /^\[sp:(track|album|playlist)\/([A-Za-z0-9]+)\]/;

export function parseVibeMessage(message: string | undefined | null): {
  music: MusicRef;
  text: string;
} {
  if (!message) return { music: null, text: "" };
  const ytMatch = message.match(YT_RE);
  if (ytMatch) {
    return {
      music: { kind: "youtube", videoId: ytMatch[1] },
      text: message.slice(ytMatch[0].length).trim(),
    };
  }
  const spMatch = message.match(SP_RE);
  if (spMatch) {
    return {
      music: {
        kind: "spotify",
        ref: { type: spMatch[1] as SpotifyType, id: spMatch[2] },
      },
      text: message.slice(spMatch[0].length).trim(),
    };
  }
  return { music: null, text: message };
}

export function encodeMusicMessage(music: MusicRef, text: string): string {
  const trimmed = text.trim();
  if (!music) return trimmed;
  let prefix = "";
  if (music.kind === "youtube") prefix = `[yt:${music.videoId}]`;
  else prefix = `[sp:${music.ref.type}/${music.ref.id}]`;
  return trimmed ? `${prefix}${trimmed}` : prefix;
}

// ─── Legacy re-exports for backward compat ────────────────────────────────
// (VibeCard used to import from utils/youtube)
export { parseYouTubeId as parseYouTubeIdLegacy };
