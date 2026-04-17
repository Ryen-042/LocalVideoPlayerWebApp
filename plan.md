## Local Video Player Implementation Plan

This plan reflects Option A for audio delay:
- v1: UI-level playback/subtitle timing controls and persisted audio-delay preference with browser-safe fallback messaging.
- later: true audio stream delay enhancement using advanced processing.

### Phase 0 - Scope and Constraints
- [x] Confirm frontend-only architecture (no backend runtime dependencies).
- [x] Confirm browser support targets: desktop Chrome/Edge/Firefox, mobile Chrome/Safari.
- [x] Finalize format policy: best-effort playback for AVI/MKV only when browser supports codec/container; otherwise show clear unsupported message.
- [x] Define v1 exclusions (no heavy in-browser transcoding by default).

### Phase 1 - Project Foundation and Offline Setup
- [x] Initialize project structure for modular HTML/CSS/JS app.
- [x] Add local vendor assets strategy (no runtime CDN links).
- [x] Configure PWA essentials (manifest and service worker registration).
- [x] Implement cache strategy for app shell and static assets.
- [ ] Verify first-load online and subsequent offline startup behavior on multiple browsers.

### Phase 2 - Core Player and Transport Controls
- [x] Implement media player state model (loading/playing/paused/ended/error).
- [x] Implement controls: play, pause, stop.
- [x] Implement seek bar with time display and scrubbing.
- [x] Implement fullscreen toggle.
- [x] Implement volume and playback speed controls.
- [x] Implement playlist prev/next navigation controls.
- [x] Add keyboard shortcuts baseline.

### Phase 3 - Playlist and File Management
- [x] Implement local file picker for single and multi-file loading.
- [x] Implement playlist model with active item and remove actions.
- [x] Implement play-next behavior with auto-next option.
- [x] Implement recent files list with safe metadata only.
- [x] Add clear playlist/history actions.

### Phase 4 - Persistence and Global Settings
- [x] Create persistent settings schema with versioning key.
- [x] Add settings page (dialog) for global preferences.
- [x] Add toggles: remember last file metadata, remember position, autoplay next.
- [x] Add toggles: enable/disable keyboard shortcuts.
- [x] Persist playback preferences (volume/speed/theme/seek step/subtitle defaults).
- [x] Add reset settings to defaults.
- [x] Add export/import settings JSON.

### Phase 5 - Advanced Playback Features (Option A)
- [x] Implement A-B repeat markers and loop toggle.
- [x] Implement A-B clear/reset controls.
- [x] Implement playback offset nudge.
- [x] Implement subtitle offset control.
- [x] Implement stream audio delay processing (Web Audio delay node) with persisted settings and browser-fallback messaging.
- [x] Add per-video timing preset overrides.

### Phase 6 - Subtitles and Track Selection (In Progress)
- [x] Implement external subtitle file loading.
- [x] Support WebVTT parsing.
- [x] Implement client-side SRT parsing/conversion path.
- [x] Implement subtitle on/off and selector UI.
- [x] Implement subtitle delay adjustment.
- [x] Expand subtitle style controls (size/background/position sliders).
- [x] Implement audio/subtitle track selection UI with graceful fallback.

### Phase 7 - Responsive and Mobile UX (In Progress)
- [x] Implement responsive layouts for desktop/tablet/mobile.
- [x] Add touch gesture controls (seek/volume).
- [x] Refine fullscreen orientation behavior on mobile.
- [x] Validate accessibility pass.

### Phase 8 - Reliability, QA, and Documentation
- [x] Add user-facing error guidance for unsupported decode paths.
- [x] Document project setup, features, settings, usage, limitations, known issues.
- [ ] Run compatibility checks across target browsers/devices.
- [ ] Run larger-file performance checks.
- [x] Finalize troubleshooting matrix.

### Phase 9 - `file://` Compatibility Mode (Planned Final Phase)
- [x] Add protocol detection and `file://` compatibility flag.
- [x] Provide fallback boot path that does not depend on module loading restrictions.
- [x] Disable unsupported runtime features automatically on `file://` (manifest/service worker expectations, install prompts).
- [x] Keep core local playback, playlist, and settings functional in `file://` mode.
- [x] Add explicit banner/tooltips describing reduced capabilities in `file://` mode.
- [x] Document `file://` mode limitations and testing checklist in README.

### Next Enhancement Backlog
- [ ] Evaluate advanced strategy for negative audio delay (audio lead) beyond browser-native delay-node capabilities.
- [ ] Embedded MKV/AVI richer compatibility strategy (optional transcoding mode).
- [x] Drag-and-drop file loading.
- [ ] Gesture controls and mini-player mode.
