# VIBECHAIN

## Current State
The app is at Version 7 — Spotify API was removed but Spotify UI remnants remain:
- PostVibePage still shows Spotify logo, Spotify placeholder text, Spotify error messages, and renders Spotify embeds
- VibeCard still renders Spotify embeds for stored Spotify references
- music.ts still exports Spotify helpers used in PostVibePage
- MusicPage is YouTube-only (already clean)

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- PostVibePage: Remove Spotify logo from Music Link section; update placeholder/error to say YouTube only; remove Spotify embed preview; update `handleMusicUrlChange` validation to YouTube-only
- VibeCard: Remove Spotify embed block (YouTube-only rendering)
- music.ts: Keep Spotify parse utils for backward compat with stored data (don't break old vibes), but PostVibePage UI shows YouTube-only

### Remove
- Spotify logo SVG from PostVibePage
- Spotify iframe preview in PostVibePage
- Spotify iframe embed in VibeCard

## Implementation Plan
1. Update PostVibePage — remove Spotify logo, change placeholder/error to YouTube-only, remove Spotify preview iframe
2. Update VibeCard — remove Spotify embed block
3. Validate and deploy
