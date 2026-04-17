# Local Video Player Web App

## What Is This Project?

Local Video Player Web App is a browser-based local media player focused on desktop-style controls, subtitle handling, and local-file privacy.

It runs fully on the frontend (HTML, CSS, JavaScript) and plays media directly from files you open in the browser.

## Screenshots

![Home Player UI](docs\screenshots\home-player-ui.png)
![Settings Menu](docs\screenshots\settings-preferences-tab.png)
![Fullscreen View](docs\screenshots\fullscreen-view.png)

## Why This Project Was Created

This project was created to provide a practical local-video experience in the browser while keeping the workflow simple:

- Play local videos without uploading files to any server.
- Keep playback controls familiar for users coming from VLC/MPC-like players.
- Support subtitle workflows (external subtitle loading and timing adjustments).
- Work well with NVIDIA RTX Video Enhancement so users can improve video quality during browser playback.

## Browser Playback + NVIDIA RTX Video Enhancement

This app is intended for local playback in a desktop browser, which allows compatible NVIDIA GPUs to apply RTX Video Enhancement.

### How To Enable RTX Video Enhancement

1. Open NVIDIA Control Panel.
2. Go to Video > Adjust video image settings.
3. Enable RTX video enhancement.
4. Choose your enhancement quality level.
5. Apply changes.
6. Play your local video in a supported browser window (for example Chrome or Edge, depending on driver/browser support).

Notes:

- Availability depends on GPU model, driver version, and browser support.
- RTX Video Enhancement is handled by NVIDIA/driver and is external to this app.

## Current Features

- Local video loading (single and multiple files)
- Playlist management with previous/next navigation
- Play, pause, stop, seek, volume, speed, fullscreen
- Keyboard shortcuts
- Touch gestures (seek, volume, double-tap fullscreen)
- A-B repeat (set A, set B, loop, clear)
- Playback offset nudge
- Subtitle offset and real-time audio-delay processing (positive delay)
- Per-video timing presets
- External subtitle loading (.srt and .vtt)
- Subtitle rendering overlay with style controls
- Audio/subtitle track selectors with graceful fallback
- Section/chapter navigation buttons
- Seek-bar section markers when sections are available
- MP4/MOV/MKV chapter fallback parsing for marker extraction when browser text tracks do not expose chapters
- Drag-and-drop file loading (media and subtitle files)
- Recent files list (metadata and direct handle path when supported)
- Persistent settings (theme, seek step, subtitle defaults, volume/speed, and more)
- Customizable keyboard shortcut bindings with persistence
- Settings export/import
- PWA app shell and offline UI caching (when served over http/https)
- File protocol compatibility mode with reduced capabilities notice

## Technologies Used

Core technologies:

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

Libraries and bundled assets:

- Plyr (local vendor bundle) for enhanced player controls
- Font Awesome (local vendor bundle) for UI icons

Platform/browser APIs used:

- HTMLMediaElement APIs for playback
- Text track APIs for subtitle/track handling
- Fullscreen API
- localStorage for persisted settings
- IndexedDB + File System Access API (where supported) for better recent-file reopening
- Service Worker + Web App Manifest for offline app shell behavior

## How To Use The App

### 1. Start The App Locally

Use a local HTTP server for best results:

```bash
python -m http.server 8099
```

Then open:

- http://localhost:8099/index.html

### 2. Load Files

Choose one of the following:

- Click Open media files
- Click Open subtitle file
- Drag and drop files onto the video area

Supported subtitle files:

- .vtt
- .srt

### 3. Playback Controls

- Play/Pause/Stop
- Seek via timeline
- Volume and speed controls
- Previous/Next file
- Fullscreen toggle

### 4. Advanced Playback

- A-B repeat controls
- Playback offset nudge
- Subtitle offset control
- Real-time audio-delay processing (positive values)
- Per-video timing preset save/clear

### 5. Subtitle and Track Workflows

- Select subtitle mode: Off, External subtitle, or embedded native track
- Select audio track when exposed by browser
- Change subtitle style:
  - Font size
  - Vertical position
  - Background opacity

### 6. Sections/Chapters

- Use previous/next section buttons in the controls.
- Seek-bar markers are shown when section data is available.
- For some files, chapter metadata can be read from MP4/MOV container metadata as fallback.

### 7. Settings and Persistence

Open settings to configure:

- Remember last file metadata
- Remember playback position
- Auto-play next file
- Keyboard shortcuts
- Remember volume/speed
- Subtitle defaults
- Theme and seek step
- Keyboard shortcut bindings (customizable and persisted)

You can also export/import settings JSON.

## Keyboard Shortcuts

All shortcuts are customizable from Settings > Preferences > Keyboard Shortcuts.

Default bindings:

- Space: Play/Pause
- Arrow Right: Seek forward by configured seek step
- Arrow Left: Seek backward by configured seek step
- Arrow Up: Volume up
- Arrow Down: Volume down
- ]: Increase playback speed
- [: Decrease playback speed
- =: Increase audio delay
- -: Decrease audio delay
- .: Increase subtitle delay
- ,: Decrease subtitle delay
- M: Mute toggle
- F: Fullscreen toggle
- N: Next file
- P: Previous file
- A: Toggle A-B loop

## Supported Formats

Video:

- Best support: MP4 (H.264/AAC), WebM
- Best effort: MOV, AVI, MKV (depends on browser codec/container support)

Subtitles:

- WebVTT (.vtt)
- SRT (.srt)

## Offline Behavior

- Service worker caches the app shell for offline UI startup after first online load.
- Local media is always read from user-selected files.

## Runtime Modes

Localhost mode (recommended):

- Full behavior (manifest + service worker + offline shell support)

File protocol compatibility mode:

- Reduced capabilities
- Core playback/playlist/settings still available

## Limitations

- Browser codec support determines whether some files (especially AVI/MKV) can play.
- Negative audio delay (audio ahead of video) is not directly supported in-browser; use Playback Offset for early-audio compensation.
- Embedded track exposure varies by browser.
- Compatibility and large-file performance matrices are still ongoing validation tasks.

## Privacy

- No file upload backend is used.
- Files remain local to your machine/browser session.
- Settings and metadata are stored locally in your browser profile.
