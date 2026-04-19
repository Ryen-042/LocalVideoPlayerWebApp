const SETTINGS_KEY = "lvp.settings.v1";
const POSITIONS_KEY = "lvp.positions.v1";
const RECENTS_KEY = "lvp.recents.v1";
const RECENT_PLAYLISTS_KEY = "lvp.recent-playlists.v1";
const TIMING_PRESETS_KEY = "lvp.timing-presets.v1";
const UI_STATE_KEY = "lvp.ui.v1";
const HANDLES_DB_NAME = "lvp.recent-handles.v1";
const HANDLES_STORE_NAME = "handles";
const IS_FILE_PROTOCOL = window.location.protocol === "file:";
let reloadedAfterSwUpdate = false;

const SHORTCUT_DEFINITIONS = [
  { id: "playPause", label: "Play/Pause", defaultBinding: "Space" },
  { id: "seekForward", label: "Seek Forward", defaultBinding: "ArrowRight" },
  { id: "seekBackward", label: "Seek Backward", defaultBinding: "ArrowLeft" },
  { id: "volumeUp", label: "Volume Up", defaultBinding: "ArrowUp" },
  { id: "volumeDown", label: "Volume Down", defaultBinding: "ArrowDown" },
  { id: "speedUp", label: "Speed Up", defaultBinding: "]" },
  { id: "speedDown", label: "Speed Down", defaultBinding: "[" },
  { id: "audioDelayUp", label: "Audio Delay +", defaultBinding: "=" },
  { id: "audioDelayDown", label: "Audio Delay -", defaultBinding: "-" },
  { id: "subtitleDelayUp", label: "Subtitle Delay +", defaultBinding: "." },
  { id: "subtitleDelayDown", label: "Subtitle Delay -", defaultBinding: "," },
  { id: "muteToggle", label: "Mute", defaultBinding: "M" },
  { id: "fullscreenToggle", label: "Fullscreen", defaultBinding: "F" },
  { id: "nextFile", label: "Next File", defaultBinding: "N" },
  { id: "previousFile", label: "Previous File", defaultBinding: "P" },
  { id: "nextSection", label: "Next Section", defaultBinding: "PageDown" },
  { id: "previousSection", label: "Previous Section", defaultBinding: "PageUp" },
  { id: "frameWidthIncrease", label: "Frame Width +", defaultBinding: "Numpad6" },
  { id: "frameWidthDecrease", label: "Frame Width -", defaultBinding: "Numpad4" },
  { id: "frameHeightIncrease", label: "Frame Height +", defaultBinding: "Numpad8" },
  { id: "frameHeightDecrease", label: "Frame Height -", defaultBinding: "Numpad2" },
  { id: "frameScaleDiagonalIncrease", label: "Frame Width+Height +", defaultBinding: "Numpad9" },
  { id: "frameScaleDiagonalDecrease", label: "Frame Width+Height -", defaultBinding: "Numpad1" },
  { id: "frameSizeReset", label: "Frame Size Reset", defaultBinding: "Numpad5" },
  { id: "frameMoveLeft", label: "Frame Move Left", defaultBinding: "Ctrl+Numpad4" },
  { id: "frameMoveRight", label: "Frame Move Right", defaultBinding: "Ctrl+Numpad6" },
  { id: "frameMoveUp", label: "Frame Move Up", defaultBinding: "Ctrl+Numpad8" },
  { id: "frameMoveDown", label: "Frame Move Down", defaultBinding: "Ctrl+Numpad2" },
  { id: "frameMoveUpRight", label: "Frame Move Up-Right", defaultBinding: "Ctrl+Numpad9" },
  { id: "frameMoveDownLeft", label: "Frame Move Down-Left", defaultBinding: "Ctrl+Numpad1" },
  { id: "frameMoveUpLeft", label: "Frame Move Up-Left", defaultBinding: "Ctrl+Numpad7" },
  { id: "frameMoveDownRight", label: "Frame Move Down-Right", defaultBinding: "Ctrl+Numpad3" },
  { id: "framePositionReset", label: "Frame Position Reset", defaultBinding: "Ctrl+Numpad5" },
  { id: "abLoopToggle", label: "A-B Loop Toggle", defaultBinding: "A" }
];

const DEFAULT_SHORTCUT_BINDINGS = Object.freeze(
  SHORTCUT_DEFINITIONS.reduce((bindings, definition) => {
    bindings[definition.id] = definition.defaultBinding;
    return bindings;
  }, {})
);

const SHORTCUT_GROUP_ORDER = [
  "playback",
  "navigation",
  "timing",
  "frame-resize",
  "frame-move"
];

const SHORTCUT_GROUP_LABELS = {
  playback: "Playback",
  navigation: "Navigation",
  timing: "Timing",
  "frame-resize": "Frame Resize",
  "frame-move": "Frame Move"
};

const SHORTCUT_NO_REPEAT_ACTIONS = new Set([
  "playPause",
  "muteToggle",
  "fullscreenToggle",
  "nextFile",
  "previousFile",
  "nextSection",
  "previousSection",
  "abLoopToggle"
]);

const defaults = {
  rememberLastFile: true,
  rememberPosition: true,
  autoplayNext: true,
  enableShortcuts: true,
  rememberVolume: true,
  rememberSpeed: true,
  showSubtitlesByDefault: true,
  preferGpuEnhancementNormalMode: true,
  shortcutSectionNavigation: false,
  enforceFrameConstraints: true,
  theme: "auto",
  seekStep: 5,
  subtitleOffset: 0,
  audioDelay: 0,
  usePerVideoTiming: false,
  subtitleFontSize: 22,
  subtitlePositionPercent: 7,
  subtitleBgOpacity: 0.3,
  frameMode: "normal-size",
  aspectRatio: "auto",
  zoomPercent: 100,
  frameScaleX: 1,
  frameScaleY: 1,
  frameOffsetXPx: 0,
  frameOffsetYPx: 0,
  playlistShuffle: false,
  playlistRepeatMode: "off",
  savedVolume: 1,
  savedSpeed: 1,
  shortcuts: { ...DEFAULT_SHORTCUT_BINDINGS }
};

const FRAME_MODE_SEQUENCE = [
  "half-size",
  "normal-size",
  "double-size",
  "stretch-window",
  "touch-inside",
  "zoom-1",
  "zoom-2",
  "touch-outside"
];
const ASPECT_RATIO_SEQUENCE = ["auto", "4:3", "5:4", "16:9", "235:100", "185:100", "sar"];
const ZOOM_STEPS = [50, 75, 100, 125, 150, 175, 200, 250, 300];
const LEGACY_FRAME_MODE_MAP = {
  "fit-width": "normal-size",
  "fit-height": "touch-inside",
  "fill-window": "stretch-window",
  "original-size": "normal-size"
};
const LEGACY_ASPECT_RATIO_MAP = {
  "1:1": "auto",
  "21:9": "235:100",
  "2.35:1": "235:100"
};
const SUBTITLE_EXTENSIONS = new Set(["srt", "vtt"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "flac", "ogg", "opus", "wav", "webm"]);
const CHAPTER_METADATA_EXTENSIONS = new Set(["mp4", "m4v", "mov", "mkv"]);
const SECTION_SYNC_EPSILON = 0.35;
const MAX_MKV_CHAPTER_SCAN_BYTES = 32 * 1024 * 1024;
const EBML_MAX_RECURSION_DEPTH = 8;
const SEEK_PREVIEW_THUMB_WIDTH = 176;
const SEEK_PREVIEW_THUMB_HEIGHT = 100;
const SEEK_PREVIEW_SEEK_TIMEOUT_MS = 450;
const AUDIO_DELAY_MAX_SECONDS = 5;
const FRAME_RESIZE_STEP = 0.04;
const FRAME_MIN_SCALE_CONSTRAINED = 0.5;
const FRAME_MAX_SCALE_CONSTRAINED = 3;
const FRAME_MIN_SCALE_FREE = 0.2;
const FRAME_MAX_SCALE_FREE = 6;

const MKV_IDS = {
  chapters: 0x1043A770,
  chapterAtom: 0xB6,
  chapterTimeStart: 0x91,
  chapterTimeEnd: 0x92,
  chapterDisplay: 0x80,
  chapterString: 0x85
};

const MKV_MASTER_IDS = new Set([
  0x1A45DFA3,
  0x18538067,
  0x1549A966,
  0x1654AE6B,
  0x1F43B675,
  0x1043A770,
  0x45B9,
  0xB6,
  0x80
]);

const state = {
  settings: { ...defaults },
  ui: {
    sidePanelCollapsed: false,
    settingsTab: "playback",
    playlistCollapsed: false,
    recentBatchExpanded: {}
  },
  player: null,
  plyrCustomButtons: {},
  playlist: [],
  currentIndex: -1,
  currentObjectUrl: null,
  subtitleCues: [],
  subtitleCueIndex: 0,
  ab: { a: null, b: null, loop: false },
  recentFiles: [],
  recentPlaylists: [],
  fileHandleByFingerprint: {},
  handleDbPromise: null,
  positions: {},
  timingPresets: {},
  selectedSubtitleTrack: "off",
  subtitleCandidates: [],
  autoSubtitleByMediaFingerprint: {},
  loadedSubtitleFingerprint: null,
  sections: [],
  sectionSignature: "",
  sectionPollTimer: null,
  sectionTrackObserverBound: false,
  sectionTrackBoundSet: new WeakSet(),
  sectionHintShownForCurrentMedia: false,
  containerSections: [],
  chapterSectionsByFingerprint: {},
  chapterParseInFlightFingerprint: null,
  draggedPlaylistIndex: null,
  currentCoverObjectUrl: null,
  subtitleLoadToken: 0,
  hoverPreviewVideo: null,
  hoverPreviewCanvas: null,
  hoverPreviewContext: null,
  hoverPreviewReady: false,
  hoverPreviewFailed: false,
  hoverPreviewBusy: false,
  hoverPreviewPendingTime: Number.NaN,
  hoverPreviewLastTime: Number.NaN,
  hoverPreviewThumbEl: null,
  dragDepth: 0,
  touch: {
    active: false,
    startX: 0,
    startY: 0,
    baseTime: 0,
    baseVolume: 1,
    mode: null,
    pointerId: null
  },
  audioDelayEngine: {
    context: null,
    sourceNode: null,
    delayNode: null,
    unavailable: false
  },
  shortcutCapture: {
    actionId: "",
    button: null
  },
  lastPersistAt: 0,
  plyrInitAttempts: 0,
  floatingMode: {
    supported: false,
    active: false
  },
  frameShortcutMode: {
    active: false,
    lastPresetMode: defaults.frameMode
  }
};

const el = {
  video: document.getElementById("video"),
  layoutRoot: document.getElementById("layoutRoot"),
  sidePanel: document.getElementById("sidePanel"),
  fileInput: document.getElementById("fileInput"),
  subtitleInput: document.getElementById("subtitleInput"),
  openFilesBtn: document.getElementById("openFilesBtn"),
  openSubtitleBtn: document.getElementById("openSubtitleBtn"),
  toggleSidePanel: document.getElementById("toggleSidePanel"),
  toggleSidePanelIcon: document.getElementById("toggleSidePanelIcon"),
  playlist: document.getElementById("playlist"),
  playlistContainer: document.getElementById("playlistContainer"),
  togglePlaylistListBtn: document.getElementById("togglePlaylistListBtn"),
  savePlaylistFileBtn: document.getElementById("savePlaylistFileBtn"),
  importPlaylistInput: document.getElementById("importPlaylistInput"),
  recentFiles: document.getElementById("recentFiles"),
  recentFoldAllBtn: document.getElementById("recentFoldAllBtn"),
  recentUnfoldAllBtn: document.getElementById("recentUnfoldAllBtn"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  stopBtn: document.getElementById("stopBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  floatingModeBtn: document.getElementById("floatingModeBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  repeatBtn: document.getElementById("repeatBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  seekInput: document.getElementById("seekInput"),
  currentTimeLabel: document.getElementById("currentTimeLabel"),
  durationLabel: document.getElementById("durationLabel"),
  volumeInput: document.getElementById("volumeInput"),
  speedSelect: document.getElementById("speedSelect"),
  frameModeSelect: document.getElementById("frameModeSelect"),
  aspectRatioSelect: document.getElementById("aspectRatioSelect"),
  zoomSelect: document.getElementById("zoomSelect"),
  subtitleOverlay: document.getElementById("subtitleOverlay"),
  statusBanner: document.getElementById("statusBanner"),
  setABeginBtn: document.getElementById("setABeginBtn"),
  setBEndBtn: document.getElementById("setBEndBtn"),
  toggleABLoopBtn: document.getElementById("toggleABLoopBtn"),
  clearABBtn: document.getElementById("clearABBtn"),
  abLabel: document.getElementById("abLabel"),
  playbackOffsetInput: document.getElementById("playbackOffsetInput"),
  applyPlaybackOffsetBtn: document.getElementById("applyPlaybackOffsetBtn"),
  subtitleOffsetInput: document.getElementById("subtitleOffsetInput"),
  audioDelayInput: document.getElementById("audioDelayInput"),
  usePerVideoTiming: document.getElementById("usePerVideoTiming"),
  saveTimingPresetBtn: document.getElementById("saveTimingPresetBtn"),
  clearTimingPresetBtn: document.getElementById("clearTimingPresetBtn"),
  subtitleSizeInput: document.getElementById("subtitleSizeInput"),
  subtitlePositionInput: document.getElementById("subtitlePositionInput"),
  subtitleBgOpacityInput: document.getElementById("subtitleBgOpacityInput"),
  audioDelayNote: document.getElementById("audioDelayNote"),
  videoShell: document.getElementById("videoShell"),
  audioCoverThumb: document.getElementById("audioCoverThumb"),
  clearPlaylistBtn: document.getElementById("clearPlaylistBtn"),
  removeCurrentBtn: document.getElementById("removeCurrentBtn"),
  toggleSettings: document.getElementById("toggleSettings"),
  settingsDialog: document.getElementById("settingsDialog"),
  rememberLastFile: document.getElementById("rememberLastFile"),
  rememberPosition: document.getElementById("rememberPosition"),
  autoplayNext: document.getElementById("autoplayNext"),
  enableShortcuts: document.getElementById("enableShortcuts"),
  preferGpuEnhancementNormalMode: document.getElementById("preferGpuEnhancementNormalMode"),
  shortcutSectionNavigation: document.getElementById("shortcutSectionNavigation"),
  enforceFrameConstraints: document.getElementById("enforceFrameConstraints"),
  rememberVolume: document.getElementById("rememberVolume"),
  rememberSpeed: document.getElementById("rememberSpeed"),
  showSubtitlesByDefault: document.getElementById("showSubtitlesByDefault"),
  themeSelect: document.getElementById("themeSelect"),
  seekStep: document.getElementById("seekStep"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  resetSettingsBtn: document.getElementById("resetSettingsBtn"),
  exportSettingsBtn: document.getElementById("exportSettingsBtn"),
  importSettingsInput: document.getElementById("importSettingsInput"),
  shortcutBindings: document.getElementById("shortcutBindings"),
  resetShortcutsBtn: document.getElementById("resetShortcutsBtn"),
  subtitleTrackSelect: document.getElementById("subtitleTrackSelect"),
  audioTrackSelect: document.getElementById("audioTrackSelect"),
  nowPlayingLabel: document.getElementById("nowPlayingLabel"),
  settingsTabButtons: Array.from(document.querySelectorAll("[data-settings-tab]")),
  settingsPanels: Array.from(document.querySelectorAll("[data-settings-panel]"))
};

init();

function init() {
  state.settings = loadJson(SETTINGS_KEY, defaults);
  state.settings.shortcuts = normalizeShortcutBindings(state.settings.shortcuts);
  state.ui = loadJson(UI_STATE_KEY, {
    sidePanelCollapsed: false,
    settingsTab: "playback",
    playlistCollapsed: false,
    recentBatchExpanded: {}
  });
  state.ui.playlistCollapsed = Boolean(state.ui.playlistCollapsed);
  if (!state.ui.recentBatchExpanded || typeof state.ui.recentBatchExpanded !== "object" || Array.isArray(state.ui.recentBatchExpanded)) {
    state.ui.recentBatchExpanded = {};
  }
  state.positions = loadJson(POSITIONS_KEY, {});
  state.recentFiles = loadJson(RECENTS_KEY, []);
  state.recentPlaylists = loadJson(RECENT_PLAYLISTS_KEY, []);
  state.timingPresets = loadJson(TIMING_PRESETS_KEY, {});
  state.floatingMode.supported = supportsFloatingMode();

  syncSettingsUI();
  applySidePanelState();
  applyPlaylistVisibilityState();
  applyTheme(state.settings.theme);
  applyPlaybackPreferences();
  applyVideoPresentation();
  updatePlaylistModeButtons();
  applySettingsTab();
  initializePlyr();
  syncFloatingModeUi();
  applySubtitleStyle();
  hideSubtitleOverlay();
  setupFullscreenOrientationHandling();
  renderRecentFiles();
  setupEventHandlers();
  updateTrackSelectors();
  registerServiceWorker();
}

function setupEventHandlers() {
  on(el.openFilesBtn, "click", onOpenFilesClicked);
  on(el.openSubtitleBtn, "click", onOpenSubtitleClicked);
  on(el.fileInput, "change", onFilesSelected);
  on(el.subtitleInput, "change", onSubtitleSelected);
  on(el.toggleSidePanel, "click", toggleSidePanel);

  on(el.playPauseBtn, "click", togglePlayPause);
  on(el.stopBtn, "click", stopPlayback);
  on(el.prevBtn, "click", playPrevious);
  on(el.nextBtn, "click", playNext);
  on(el.floatingModeBtn, "click", toggleFloatingMode);
  on(el.shuffleBtn, "click", togglePlaylistShuffle);
  on(el.repeatBtn, "click", cyclePlaylistRepeatMode);
  on(el.fullscreenBtn, "click", toggleFullscreen);

  on(el.seekInput, "input", onSeekInput);
  on(el.volumeInput, "input", onVolumeInput);
  on(el.speedSelect, "change", onSpeedChange);
  on(el.frameModeSelect, "change", onFrameModeChanged);
  on(el.aspectRatioSelect, "change", onAspectRatioChanged);
  on(el.zoomSelect, "change", onZoomChanged);

  on(el.video, "timeupdate", onTimeUpdate);
  on(el.video, "loadedmetadata", onLoadedMetadata);
  on(el.video, "play", onVideoPlay);
  on(el.video, "pause", syncPlayButtonLabel);
  on(el.video, "ended", onEnded);
  on(el.video, "error", onMediaError);
  on(el.video, "volumechange", onVideoVolumeChanged);
  on(el.video, "ratechange", onVideoRateChanged);
  on(el.video, "enterpictureinpicture", onEnterFloatingMode);
  on(el.video, "leavepictureinpicture", onLeaveFloatingMode);

  bindSectionTrackObservers();

  on(el.setABeginBtn, "click", setA);
  on(el.setBEndBtn, "click", setB);
  on(el.toggleABLoopBtn, "click", toggleABLoop);
  on(el.clearABBtn, "click", clearAB);

  on(el.applyPlaybackOffsetBtn, "click", applyPlaybackOffset);
  on(el.subtitleOffsetInput, "change", onSubtitleOffsetChange);
  on(el.audioDelayInput, "change", onAudioDelayChange);
  on(el.usePerVideoTiming, "change", onUsePerVideoTimingChanged);
  on(el.saveTimingPresetBtn, "click", saveCurrentTimingPreset);
  on(el.clearTimingPresetBtn, "click", clearCurrentTimingPreset);
  on(el.subtitleSizeInput, "input", onSubtitleStyleChanged);
  on(el.subtitlePositionInput, "input", onSubtitleStyleChanged);
  on(el.subtitleBgOpacityInput, "input", onSubtitleStyleChanged);

  on(el.clearPlaylistBtn, "click", clearPlaylist);
  on(el.removeCurrentBtn, "click", removeCurrent);
  on(el.togglePlaylistListBtn, "click", togglePlaylistVisibility);
  on(el.savePlaylistFileBtn, "click", savePlaylistToFile);
  on(el.importPlaylistInput, "change", importPlaylistFile);
  on(el.recentFoldAllBtn, "click", () => setAllRecentBatchExpansion(false));
  on(el.recentUnfoldAllBtn, "click", () => setAllRecentBatchExpansion(true));

  on(el.toggleSettings, "click", openSettingsDialog);
  on(el.settingsDialog, "close", saveSettingsFromUI);
  on(el.settingsDialog, "click", onSettingsDialogBackdropClick);
  on(el.resetSettingsBtn, "click", resetSettings);
  on(el.exportSettingsBtn, "click", exportSettings);
  on(el.importSettingsInput, "change", importSettings);
  on(el.shortcutBindings, "click", onShortcutBindingsClick);
  on(el.resetShortcutsBtn, "click", resetShortcutBindings);

  el.settingsTabButtons.forEach((tabButton) => {
    on(tabButton, "click", () => {
      const tab = tabButton.getAttribute("data-settings-tab");
      if (!tab) {
        return;
      }
      state.ui.settingsTab = tab;
      applySettingsTab();
      persistUiState();
    });
  });

  on(el.subtitleTrackSelect, "change", onSubtitleTrackChanged);
  on(el.audioTrackSelect, "change", onAudioTrackChanged);

  setupTouchGestures();
  setupDragAndDrop();
  window.addEventListener("resize", onViewportResize, { passive: true });
  document.addEventListener("pointerdown", resumeAudioDelayContext, { passive: true });
  document.addEventListener("keydown", onKeyDown);
}

function setupDragAndDrop() {
  const target = el.videoShell || document.body;
  if (!target) {
    return;
  }

  const isFileDragEvent = (event) => {
    const types = event.dataTransfer?.types;
    if (!types) {
      return false;
    }
    return Array.from(types).includes("Files");
  };

  const suppressBrowserFileDrop = (event) => {
    if (!isFileDragEvent(event)) {
      return;
    }

    event.preventDefault();
    if (event.type === "dragover" && event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDragEnter = (event) => {
    if (!isFileDragEvent(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    state.dragDepth += 1;
    setDragOverState(true);
  };

  const handleDragOver = (event) => {
    if (!isFileDragEvent(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    setDragOverState(true);
  };

  const handleDragLeave = (event) => {
    if (!isFileDragEvent(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    state.dragDepth = Math.max(0, state.dragDepth - 1);
    if (state.dragDepth === 0) {
      setDragOverState(false);
    }
  };

  const handleDrop = (event) => {
    if (!isFileDragEvent(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    state.dragDepth = 0;
    setDragOverState(false);

    const files = Array.from(event.dataTransfer?.files || []);
    if (!files.length) {
      setStatus("Drop files here to add media or subtitles.");
      return;
    }

    addFilesToPlaylist(files, { sourceLabel: "Open files" });
    setStatus(`Dropped ${files.length} file${files.length === 1 ? "" : "s"}.`);
  };

  ["dragenter", "dragover", "drop"].forEach((eventName) => {
    window.addEventListener(eventName, suppressBrowserFileDrop, true);
    document.addEventListener(eventName, suppressBrowserFileDrop, true);
  });

  window.addEventListener("dragend", () => {
    state.dragDepth = 0;
    setDragOverState(false);
  });

  window.addEventListener("blur", () => {
    state.dragDepth = 0;
    setDragOverState(false);
  });

  target.addEventListener("dragenter", handleDragEnter);
  target.addEventListener("dragover", handleDragOver);
  target.addEventListener("dragleave", handleDragLeave);
  target.addEventListener("drop", handleDrop);
}

function setDragOverState(isActive) {
  if (!el.videoShell) {
    return;
  }

  el.videoShell.classList.toggle("is-drag-over", Boolean(isActive));
}

function on(element, eventName, handler) {
  if (!element) {
    return;
  }

  element.addEventListener(eventName, handler);
}

async function onOpenFilesClicked() {
  if (!supportsDirectFileReopen()) {
    el.fileInput?.click();
    return;
  }

  try {
    const handles = await window.showOpenFilePicker({
      multiple: true,
      types: [
        {
          description: "Media and subtitle files",
          accept: {
            "video/*": [".mp4", ".webm", ".mov", ".mkv", ".avi"],
            "audio/*": [".mp3", ".m4a", ".aac", ".flac", ".ogg", ".wav", ".opus"],
            "text/plain": [".srt", ".vtt"],
            "text/vtt": [".vtt"]
          }
        }
      ]
    });

    const files = [];
    for (const handle of handles) {
      const file = await handle.getFile();
      await storeRecentHandle(getFileFingerprint(file), handle);
      files.push(file);
    }

    addFilesToPlaylist(files, { sourceLabel: "Drag and drop" });
  } catch (error) {
    if (error?.name !== "AbortError") {
      setStatus("Open dialog failed. Falling back to browser file input.");
      el.fileInput?.click();
    }
  }
}

async function onOpenSubtitleClicked() {
  if (!supportsDirectFileReopen()) {
    el.subtitleInput?.click();
    return;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "Subtitle files",
          accept: {
            "text/plain": [".srt", ".vtt"],
            "text/vtt": [".vtt"]
          }
        }
      ]
    });

    if (!handle) {
      return;
    }

    const file = await handle.getFile();
    await loadSubtitleFile(file);
  } catch (error) {
    if (error?.name !== "AbortError") {
      setStatus("Subtitle picker failed. Use the fallback file input.");
      el.subtitleInput?.click();
    }
  }
}

function onFilesSelected(event) {
  const files = Array.from(event.target.files || []);
  addFilesToPlaylist(files, { sourceLabel: "Browser file input" });

  event.target.value = "";
}

function addFilesToPlaylist(files, options = {}) {
  const { suppressRecentBatch = false, sourceLabel = "Playlist batch" } = options;
  if (!files.length) {
    return;
  }

  const mediaFiles = [];
  const subtitleFiles = [];

  files.forEach((file) => {
    if (isSubtitleFile(file)) {
      subtitleFiles.push(file);
      return;
    }

    mediaFiles.push(file);
  });

  subtitleFiles.forEach((file) => registerSubtitleCandidate(file));
  refreshAutoSubtitleMatches();

  if (!mediaFiles.length) {
    if (subtitleFiles.length) {
      setStatus(`Indexed ${subtitleFiles.length} subtitle file${subtitleFiles.length === 1 ? "" : "s"} for auto matching.`);
    }
    return;
  }

  mediaFiles.forEach((file) => {
    state.playlist.push(file);
    maybeWarnForContainer(file.name);
  });

  if (!suppressRecentBatch) {
    rememberRecentPlaylistBatch(mediaFiles, sourceLabel);
  }

  renderPlaylist();
  if (state.currentIndex === -1) {
    playAtIndex(0);
  } else {
    const subtitleNotice = subtitleFiles.length
      ? ` and indexed ${subtitleFiles.length} subtitle file${subtitleFiles.length === 1 ? "" : "s"}`
      : "";
    setStatus(`${mediaFiles.length} media file${mediaFiles.length === 1 ? "" : "s"} added to playlist${subtitleNotice}.`);
  }
}

function isSubtitleFile(file) {
  if (!file?.name) {
    return false;
  }

  const extension = getFileExtension(file.name);
  return SUBTITLE_EXTENSIONS.has(extension);
}

function getFileExtension(fileName) {
  const value = String(fileName || "").toLowerCase();
  const index = value.lastIndexOf(".");
  if (index < 0) {
    return "";
  }

  return value.slice(index + 1);
}

function normalizeMediaBaseName(fileName) {
  return String(fileName || "")
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase();
}

function registerSubtitleCandidate(file) {
  if (!file || !isSubtitleFile(file)) {
    return;
  }

  const fingerprint = getFileFingerprint(file);
  if (state.subtitleCandidates.some((candidate) => getFileFingerprint(candidate) === fingerprint)) {
    return;
  }

  state.subtitleCandidates.push(file);
}

function subtitleMatchesMediaName(mediaBaseName, subtitleBaseName) {
  if (!mediaBaseName || !subtitleBaseName) {
    return false;
  }

  if (subtitleBaseName === mediaBaseName) {
    return true;
  }

  return subtitleBaseName.startsWith(`${mediaBaseName}.`)
    || subtitleBaseName.startsWith(`${mediaBaseName}_`)
    || subtitleBaseName.startsWith(`${mediaBaseName}-`)
    || subtitleBaseName.startsWith(`${mediaBaseName} `);
}

function findMatchingSubtitleForMedia(mediaFile) {
  if (!mediaFile) {
    return null;
  }

  const mediaBaseName = normalizeMediaBaseName(mediaFile.name);
  for (let i = state.subtitleCandidates.length - 1; i >= 0; i -= 1) {
    const candidate = state.subtitleCandidates[i];
    const subtitleBaseName = normalizeMediaBaseName(candidate.name);
    if (subtitleMatchesMediaName(mediaBaseName, subtitleBaseName)) {
      return candidate;
    }
  }

  return null;
}

function refreshAutoSubtitleMatches() {
  state.playlist.forEach((mediaFile) => {
    const mediaFingerprint = getFileFingerprint(mediaFile);
    if (state.autoSubtitleByMediaFingerprint[mediaFingerprint]) {
      return;
    }

    const match = findMatchingSubtitleForMedia(mediaFile);
    if (match) {
      state.autoSubtitleByMediaFingerprint[mediaFingerprint] = match;
    }
  });
}

async function autoLoadMatchingSubtitleForMedia(mediaFile) {
  if (!mediaFile) {
    return;
  }

  if (state.selectedSubtitleTrack === "off" || !state.settings.showSubtitlesByDefault) {
    return;
  }

  const mediaFingerprint = getFileFingerprint(mediaFile);
  let subtitleFile = state.autoSubtitleByMediaFingerprint[mediaFingerprint] || null;

  if (!subtitleFile) {
    subtitleFile = findMatchingSubtitleForMedia(mediaFile);
    if (subtitleFile) {
      state.autoSubtitleByMediaFingerprint[mediaFingerprint] = subtitleFile;
    }
  }

  if (!subtitleFile) {
    return;
  }

  const subtitleFingerprint = getFileFingerprint(subtitleFile);
  if (state.loadedSubtitleFingerprint === subtitleFingerprint) {
    return;
  }

  const loadToken = state.subtitleLoadToken;

  await loadSubtitleFile(subtitleFile, {
    source: "auto",
    quiet: true,
    expectedMediaFingerprint: mediaFingerprint,
    loadToken
  });
}

function maybeWarnForContainer(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "mkv" || ext === "avi") {
    setStatus(`Attempting playback for ${ext.toUpperCase()}. Browser support varies by codec/container.`);
  }
}

function toggleSidePanel() {
  state.ui.sidePanelCollapsed = !state.ui.sidePanelCollapsed;
  applySidePanelState();
  persistUiState();
}

function applySidePanelState() {
  const collapsed = Boolean(state.ui.sidePanelCollapsed);

  if (el.layoutRoot) {
    el.layoutRoot.setAttribute("data-panel-collapsed", collapsed ? "true" : "false");
  }

  if (el.toggleSidePanel) {
    el.toggleSidePanel.setAttribute("aria-expanded", String(!collapsed));
    el.toggleSidePanel.title = collapsed ? "Expand side panel" : "Collapse side panel";
    el.toggleSidePanel.setAttribute("aria-label", collapsed ? "Expand side panel" : "Collapse side panel");
  }

  if (el.toggleSidePanelIcon) {
    el.toggleSidePanelIcon.classList.remove("fa-angles-left", "fa-angles-right");
    el.toggleSidePanelIcon.classList.add(collapsed ? "fa-angles-right" : "fa-angles-left");
  }
}

function persistUiState() {
  localStorage.setItem(UI_STATE_KEY, JSON.stringify(state.ui));
}

function applyPlaylistVisibilityState() {
  const collapsed = Boolean(state.ui.playlistCollapsed);

  if (el.playlistContainer) {
    el.playlistContainer.hidden = collapsed;
  }

  if (el.togglePlaylistListBtn) {
    el.togglePlaylistListBtn.textContent = collapsed ? "Unfold" : "Fold";
    el.togglePlaylistListBtn.setAttribute("aria-expanded", String(!collapsed));
    el.togglePlaylistListBtn.title = collapsed ? "Show playlist" : "Hide playlist";
    el.togglePlaylistListBtn.setAttribute("aria-label", el.togglePlaylistListBtn.title);
  }
}

function togglePlaylistVisibility() {
  state.ui.playlistCollapsed = !state.ui.playlistCollapsed;
  applyPlaylistVisibilityState();
  persistUiState();
}

function openSettingsDialog() {
  applySettingsTab();
  el.settingsDialog.showModal();
}

function onSettingsDialogBackdropClick(event) {
  if (!el.settingsDialog || event.target !== el.settingsDialog) {
    return;
  }

  el.settingsDialog.close();
}

function applySettingsTab() {
  const tabIds = el.settingsTabButtons.map((button) => button.getAttribute("data-settings-tab"));
  const activeTab = tabIds.includes(state.ui.settingsTab) ? state.ui.settingsTab : "playback";
  state.ui.settingsTab = activeTab;

  el.settingsTabButtons.forEach((tabButton) => {
    const isActive = tabButton.getAttribute("data-settings-tab") === activeTab;
    tabButton.classList.toggle("is-active", isActive);
    tabButton.setAttribute("aria-selected", String(isActive));
  });

  el.settingsPanels.forEach((panel) => {
    const isActive = panel.getAttribute("data-settings-panel") === activeTab;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

function onFrameModeChanged() {
  if (!el.frameModeSelect) {
    return;
  }

  const selectedMode = el.frameModeSelect.value;
  if (selectedMode === "custom") {
    el.frameModeSelect.value = state.frameShortcutMode.active
      ? "custom"
      : normalizeFrameModeValue(state.settings.frameMode);
    return;
  }

  commitFrameModePresetSelection(selectedMode);
  blurSelectIfActive(el.frameModeSelect);
  applyVideoPresentation();
  saveSettings();
  setStatus(`Frame mode: ${humanizeFrameMode(state.settings.frameMode)}`);
}

function onAspectRatioChanged() {
  if (!el.aspectRatioSelect) {
    return;
  }

  state.settings.aspectRatio = normalizeAspectRatioSelection(el.aspectRatioSelect.value);
  blurSelectIfActive(el.aspectRatioSelect);
  applyVideoPresentation();
  saveSettings();
  setStatus(`Aspect ratio: ${humanizeAspectRatio(state.settings.aspectRatio)}`);
}

function onZoomChanged() {
  if (!el.zoomSelect) {
    return;
  }

  state.settings.zoomPercent = clamp(Number(el.zoomSelect.value), 50, 300);
  blurSelectIfActive(el.zoomSelect);
  applyVideoPresentation();
  saveSettings();
  setStatus(`Zoom: ${state.settings.zoomPercent}%`);
}

function cycleFrameMode() {
  const current = FRAME_MODE_SEQUENCE.indexOf(state.settings.frameMode);
  const nextIndex = (Math.max(current, 0) + 1) % FRAME_MODE_SEQUENCE.length;
  commitFrameModePresetSelection(FRAME_MODE_SEQUENCE[nextIndex]);
  applyVideoPresentation();
  saveSettings();
  setStatus(`Frame mode: ${humanizeFrameMode(state.settings.frameMode)}`);
}

function cycleAspectRatio() {
  const current = ASPECT_RATIO_SEQUENCE.indexOf(normalizeAspectRatioSelection(state.settings.aspectRatio));
  const nextIndex = (Math.max(current, 0) + 1) % ASPECT_RATIO_SEQUENCE.length;
  state.settings.aspectRatio = ASPECT_RATIO_SEQUENCE[nextIndex];
  applyVideoPresentation();
  saveSettings();
  setStatus(`Aspect ratio: ${humanizeAspectRatio(state.settings.aspectRatio)}`);
}

function stepZoom(direction) {
  const current = clamp(Number(state.settings.zoomPercent || 100), 50, 300);
  const index = ZOOM_STEPS.findIndex((step) => step >= current);
  const baseIndex = index < 0 ? ZOOM_STEPS.length - 1 : index;
  const nextIndex = clamp(baseIndex + direction, 0, ZOOM_STEPS.length - 1);
  state.settings.zoomPercent = ZOOM_STEPS[nextIndex];
  applyVideoPresentation();
  saveSettings();
  setStatus(`Zoom: ${state.settings.zoomPercent}%`);
}

function blurSelectIfActive(selectElement) {
  if (document.activeElement === selectElement && typeof selectElement?.blur === "function") {
    selectElement.blur();
  }
}

function commitFrameModePresetSelection(modeValue) {
  const normalizedMode = normalizeFrameModeValue(modeValue);
  if (state.frameShortcutMode.active || !areFrameTransformsAtDefaults()) {
    resetFrameTransformValuesToDefaults();
  }

  state.settings.frameMode = normalizedMode;
  state.frameShortcutMode.lastPresetMode = normalizedMode;
  state.frameShortcutMode.active = false;
}

function markFrameModeCustomOverrideFromShortcuts() {
  if (!state.frameShortcutMode.active) {
    state.frameShortcutMode.lastPresetMode = normalizeFrameModeValue(state.settings.frameMode);
  }

  state.frameShortcutMode.active = true;
}

function restoreFrameModePresetAfterSizeReset() {
  const restoredMode = normalizeFrameModeValue(state.frameShortcutMode.lastPresetMode || defaults.frameMode);
  state.settings.frameMode = restoredMode;
  state.frameShortcutMode.lastPresetMode = restoredMode;
  state.frameShortcutMode.active = false;
}

function areFrameTransformsAtDefaults() {
  const frameScaleX = Number(state.settings.frameScaleX || defaults.frameScaleX);
  const frameScaleY = Number(state.settings.frameScaleY || defaults.frameScaleY);
  const frameOffsetXPx = Number(state.settings.frameOffsetXPx || defaults.frameOffsetXPx);
  const frameOffsetYPx = Number(state.settings.frameOffsetYPx || defaults.frameOffsetYPx);

  return Math.abs(frameScaleX - defaults.frameScaleX) < 0.001
    && Math.abs(frameScaleY - defaults.frameScaleY) < 0.001
    && Math.abs(frameOffsetXPx - defaults.frameOffsetXPx) < 0.01
    && Math.abs(frameOffsetYPx - defaults.frameOffsetYPx) < 0.01;
}

function resetFrameTransformValuesToDefaults() {
  state.settings.frameScaleX = defaults.frameScaleX;
  state.settings.frameScaleY = defaults.frameScaleY;
  state.settings.frameOffsetXPx = defaults.frameOffsetXPx;
  state.settings.frameOffsetYPx = defaults.frameOffsetYPx;
}

function resolveShellAspectRatio(aspectRatioSelection) {
  if (aspectRatioSelection !== "auto" && aspectRatioSelection !== "sar") {
    return normalizeAspectRatioValue(aspectRatioSelection);
  }

  const intrinsicWidth = Number(el.video?.videoWidth || 0);
  const intrinsicHeight = Number(el.video?.videoHeight || 0);
  if (!Number.isFinite(intrinsicWidth) || !Number.isFinite(intrinsicHeight) || intrinsicWidth <= 0 || intrinsicHeight <= 0) {
    return "";
  }

  return `${intrinsicWidth} / ${intrinsicHeight}`;
}

function applyVideoPresentation() {
  const frameMode = normalizeFrameModeValue(state.settings.frameMode);
  const aspectRatio = normalizeAspectRatioSelection(state.settings.aspectRatio);
  const requestedZoom = clamp(Number(state.settings.zoomPercent || defaults.zoomPercent), 50, 300);
  const zoomPercent = ZOOM_STEPS.reduce((closest, step) => {
    return Math.abs(step - requestedZoom) < Math.abs(closest - requestedZoom) ? step : closest;
  }, ZOOM_STEPS[0]);
  const frameModePreset = resolveFrameModePreset(frameMode);
  const effectiveScale = clamp((zoomPercent / 100) * frameModePreset.zoomMultiplier, 0.25, 6);

  normalizeFrameTransformSettings();
  const frameScaleX = Number(state.settings.frameScaleX || defaults.frameScaleX);
  const frameScaleY = Number(state.settings.frameScaleY || defaults.frameScaleY);
  const frameOffsetXPx = Number(state.settings.frameOffsetXPx || defaults.frameOffsetXPx);
  const frameOffsetYPx = Number(state.settings.frameOffsetYPx || defaults.frameOffsetYPx);

  state.settings.frameMode = frameMode;
  state.settings.aspectRatio = aspectRatio;
  state.settings.zoomPercent = zoomPercent;

  if (el.videoShell) {
    el.videoShell.setAttribute("data-frame-mode", frameMode);
    el.videoShell.style.setProperty("--video-zoom", String(effectiveScale));
    el.videoShell.style.setProperty("--video-scale-x", String(frameScaleX));
    el.videoShell.style.setProperty("--video-scale-y", String(frameScaleY));
    el.videoShell.style.setProperty("--video-offset-x", `${frameOffsetXPx}px`);
    el.videoShell.style.setProperty("--video-offset-y", `${frameOffsetYPx}px`);

    const shellAspectRatio = resolveShellAspectRatio(aspectRatio);
    if (shellAspectRatio) {
      el.videoShell.style.setProperty("--shell-ratio", shellAspectRatio);
    } else {
      el.videoShell.style.removeProperty("--shell-ratio");
    }
  }

  el.video.style.objectFit = frameModePreset.objectFit;
  el.video.style.width = "100%";
  el.video.style.height = "100%";

  if (el.audioCoverThumb) {
    el.audioCoverThumb.style.objectFit = frameModePreset.objectFit;
    el.audioCoverThumb.style.width = "100%";
    el.audioCoverThumb.style.height = "100%";
  }

  if (aspectRatio === "auto" || aspectRatio === "sar") {
    el.video.style.aspectRatio = "";
    if (el.audioCoverThumb) {
      el.audioCoverThumb.style.aspectRatio = "";
    }
  } else {
    const normalized = normalizeAspectRatioValue(aspectRatio);
    el.video.style.aspectRatio = normalized;
    if (el.audioCoverThumb) {
      el.audioCoverThumb.style.aspectRatio = normalized;
    }
  }

  if (el.frameModeSelect) {
    const frameModeSelectValue = state.frameShortcutMode.active ? "custom" : frameMode;
    const hasOption = Boolean(el.frameModeSelect.querySelector(`option[value="${frameModeSelectValue}"]`));
    el.frameModeSelect.value = hasOption ? frameModeSelectValue : frameMode;
  }

  if (el.aspectRatioSelect) {
    el.aspectRatioSelect.value = aspectRatio;
  }

  if (el.zoomSelect) {
    el.zoomSelect.value = String(zoomPercent);
  }

  applyGpuEnhancementCompatibilityMode();
}

function shouldUseGpuEnhancementCompatibilityPath() {
  const preferCompatibility = state.settings.preferGpuEnhancementNormalMode !== false;
  const isFloating = document.pictureInPictureElement === el.video || state.floatingMode.active;
  return preferCompatibility
    && !isFloating
    && isDefaultFramePresentationForCompatibility();
}

function isDefaultFramePresentationForCompatibility() {
  const frameMode = normalizeFrameModeValue(state.settings.frameMode);
  const zoomPercent = clamp(Number(state.settings.zoomPercent || defaults.zoomPercent), 50, 300);
  const frameScaleX = Number(state.settings.frameScaleX || defaults.frameScaleX);
  const frameScaleY = Number(state.settings.frameScaleY || defaults.frameScaleY);
  const frameOffsetXPx = Number(state.settings.frameOffsetXPx || defaults.frameOffsetXPx);
  const frameOffsetYPx = Number(state.settings.frameOffsetYPx || defaults.frameOffsetYPx);

  return frameMode === defaults.frameMode
    && zoomPercent === defaults.zoomPercent
    && Math.abs(frameScaleX - defaults.frameScaleX) < 0.001
    && Math.abs(frameScaleY - defaults.frameScaleY) < 0.001
    && Math.abs(frameOffsetXPx - defaults.frameOffsetXPx) < 0.01
    && Math.abs(frameOffsetYPx - defaults.frameOffsetYPx) < 0.01;
}

function applyGpuEnhancementCompatibilityMode() {
  if (!el.videoShell) {
    return;
  }

  const shouldUseNativePath = shouldUseGpuEnhancementCompatibilityPath();

  el.videoShell.classList.toggle("is-gpu-enhancement-friendly", shouldUseNativePath);

  if (shouldUseNativePath) {
    el.video.style.willChange = "auto";
    teardownSeekThumbnailSource();
    return;
  }

  el.video.style.removeProperty("will-change");

  const currentFile = state.playlist[state.currentIndex];
  if (!state.hoverPreviewVideo && currentFile && !isAudioLikeFile(currentFile) && state.currentObjectUrl) {
    prepareSeekThumbnailSource(currentFile);
  }
}

function normalizeFrameTransformSettings() {
  state.settings.enforceFrameConstraints = state.settings.enforceFrameConstraints !== false;

  const scaleX = Number(state.settings.frameScaleX);
  const scaleY = Number(state.settings.frameScaleY);
  const offsetXPx = Number(state.settings.frameOffsetXPx);
  const offsetYPx = Number(state.settings.frameOffsetYPx);

  state.settings.frameScaleX = Number.isFinite(scaleX) ? scaleX : defaults.frameScaleX;
  state.settings.frameScaleY = Number.isFinite(scaleY) ? scaleY : defaults.frameScaleY;
  state.settings.frameOffsetXPx = Number.isFinite(offsetXPx) ? offsetXPx : defaults.frameOffsetXPx;
  state.settings.frameOffsetYPx = Number.isFinite(offsetYPx) ? offsetYPx : defaults.frameOffsetYPx;

  constrainFrameTransform();
}

function constrainFrameTransform() {
  const isConstrained = Boolean(state.settings.enforceFrameConstraints);
  const minScale = isConstrained ? FRAME_MIN_SCALE_CONSTRAINED : FRAME_MIN_SCALE_FREE;
  const maxScale = isConstrained ? FRAME_MAX_SCALE_CONSTRAINED : FRAME_MAX_SCALE_FREE;

  state.settings.frameScaleX = clamp(Number(state.settings.frameScaleX || 1), minScale, maxScale);
  state.settings.frameScaleY = clamp(Number(state.settings.frameScaleY || 1), minScale, maxScale);

  const shellRect = el.videoShell?.getBoundingClientRect?.();
  const hasShellRect = Boolean(shellRect && shellRect.width > 0 && shellRect.height > 0);

  const maxOffsetX = isConstrained && hasShellRect
    ? Math.max(24, shellRect.width * 0.45)
    : 5000;
  const maxOffsetY = isConstrained && hasShellRect
    ? Math.max(24, shellRect.height * 0.45)
    : 5000;

  state.settings.frameOffsetXPx = clamp(Number(state.settings.frameOffsetXPx || 0), -maxOffsetX, maxOffsetX);
  state.settings.frameOffsetYPx = clamp(Number(state.settings.frameOffsetYPx || 0), -maxOffsetY, maxOffsetY);
}

function getFrameMoveStepPx() {
  const shellRect = el.videoShell?.getBoundingClientRect?.();
  if (!shellRect || !shellRect.width || !shellRect.height) {
    return 20;
  }

  const relativeStep = Math.round(Math.min(shellRect.width, shellRect.height) * 0.03);
  return clamp(relativeStep, 10, 36);
}

function queueFrameTransformSave() {
  clearTimeout(queueFrameTransformSave.timer);
  queueFrameTransformSave.timer = window.setTimeout(() => {
    saveSettings();
  }, 140);
}

function adjustFrameScale(deltaX, deltaY) {
  normalizeFrameTransformSettings();
  markFrameModeCustomOverrideFromShortcuts();

  state.settings.frameScaleX = Number((state.settings.frameScaleX + deltaX).toFixed(3));
  state.settings.frameScaleY = Number((state.settings.frameScaleY + deltaY).toFixed(3));

  applyVideoPresentation();
  queueFrameTransformSave();
}

function adjustFrameOffset(deltaX, deltaY) {
  normalizeFrameTransformSettings();
  markFrameModeCustomOverrideFromShortcuts();

  state.settings.frameOffsetXPx = Number((state.settings.frameOffsetXPx + deltaX).toFixed(2));
  state.settings.frameOffsetYPx = Number((state.settings.frameOffsetYPx + deltaY).toFixed(2));

  applyVideoPresentation();
  queueFrameTransformSave();
}

function resetFrameScale() {
  state.settings.frameScaleX = defaults.frameScaleX;
  state.settings.frameScaleY = defaults.frameScaleY;
  if (state.frameShortcutMode.active && areFrameTransformsAtDefaults()) {
    restoreFrameModePresetAfterSizeReset();
  }

  applyVideoPresentation();
  queueFrameTransformSave();
  setStatus("Video frame size reset.");
}

function resetFrameOffset() {
  state.settings.frameOffsetXPx = defaults.frameOffsetXPx;
  state.settings.frameOffsetYPx = defaults.frameOffsetYPx;
  if (state.frameShortcutMode.active && areFrameTransformsAtDefaults()) {
    restoreFrameModePresetAfterSizeReset();
  }

  applyVideoPresentation();
  queueFrameTransformSave();
  setStatus("Video frame position reset.");
}

function onViewportResize() {
  if (!state.settings.enforceFrameConstraints) {
    return;
  }

  applyVideoPresentation();
}

function normalizeFrameModeValue(value) {
  const mapped = LEGACY_FRAME_MODE_MAP[value] || value;
  return FRAME_MODE_SEQUENCE.includes(mapped) ? mapped : defaults.frameMode;
}

function normalizeAspectRatioSelection(value) {
  const mapped = LEGACY_ASPECT_RATIO_MAP[value] || value;
  return ASPECT_RATIO_SEQUENCE.includes(mapped) ? mapped : defaults.aspectRatio;
}

function resolveFrameModePreset(frameMode) {
  switch (frameMode) {
    case "half-size":
      return { objectFit: "contain", zoomMultiplier: 0.5 };
    case "double-size":
      return { objectFit: "contain", zoomMultiplier: 2 };
    case "stretch-window":
      return { objectFit: "fill", zoomMultiplier: 1 };
    case "touch-inside":
      return { objectFit: "contain", zoomMultiplier: 1 };
    case "zoom-1":
      return { objectFit: "contain", zoomMultiplier: 1.25 };
    case "zoom-2":
      return { objectFit: "contain", zoomMultiplier: 1.5 };
    case "touch-outside":
      return { objectFit: "cover", zoomMultiplier: 1 };
    default:
      return { objectFit: "contain", zoomMultiplier: 1 };
  }
}

function normalizeAspectRatioValue(value) {
  const match = String(value).match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) {
    return "";
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "";
  }

  return `${width} / ${height}`;
}

function humanizeFrameMode(value) {
  switch (value) {
    case "half-size":
      return "Half Size";
    case "double-size":
      return "Double Size";
    case "stretch-window":
      return "Stretch To Window";
    case "touch-inside":
      return "Touch Window From Inside";
    case "zoom-1":
      return "Zoom 1";
    case "zoom-2":
      return "Zoom 2";
    case "touch-outside":
      return "Touch Window From Outside";
    default:
      return "Normal Size";
  }
}

function humanizeAspectRatio(value) {
  if (value === "auto") {
    return "Default (DAR)";
  }

  if (value === "sar") {
    return "Assume square pixels (SAR)";
  }

  return value;
}

function onSubtitleSelected(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  registerSubtitleCandidate(file);

  const currentFile = state.playlist[state.currentIndex];
  if (currentFile) {
    const mediaFingerprint = getFileFingerprint(currentFile);
    state.autoSubtitleByMediaFingerprint[mediaFingerprint] = file;
  }

  state.subtitleLoadToken += 1;
  const expectedMediaFingerprint = getCurrentMediaFingerprint();

  loadSubtitleFile(file, {
    source: "manual",
    expectedMediaFingerprint,
    loadToken: state.subtitleLoadToken
  });

  event.target.value = "";
}

async function loadSubtitleFile(file, options = {}) {
  const {
    source = "manual",
    quiet = false,
    expectedMediaFingerprint = "",
    loadToken = state.subtitleLoadToken
  } = options;

  try {
    const text = await file.text();
    const extension = file.name.split(".").pop()?.toLowerCase();
    const parsedCues = extension === "srt"
      ? parseSrt(text)
      : parseVtt(text);

    if (loadToken !== state.subtitleLoadToken) {
      return;
    }

    if (expectedMediaFingerprint) {
      const currentMediaFingerprint = getCurrentMediaFingerprint();
      if (currentMediaFingerprint && currentMediaFingerprint !== expectedMediaFingerprint) {
        return;
      }
    }

    if (source === "auto" && (state.selectedSubtitleTrack === "off" || !state.settings.showSubtitlesByDefault)) {
      return;
    }

    state.subtitleCues = parsedCues;
    state.subtitleCueIndex = 0;
    state.loadedSubtitleFingerprint = getFileFingerprint(file);

    if (!state.subtitleCues.length) {
      if (!quiet) {
        setStatus("Subtitle parsing produced no cues.");
      }
    } else {
      if (!quiet) {
        setStatus(`Loaded subtitle: ${file.name} (${state.subtitleCues.length} cues)`);
      } else if (source === "auto") {
        setStatus(`Auto-loaded subtitle: ${file.name}`);
      }
      state.selectedSubtitleTrack = "custom";
      state.settings.showSubtitlesByDefault = true;
      saveSettings();
    }

    updateTrackSelectors();
  } catch {
    setStatus("Unable to read subtitle file.");
  }
}

function renderPlaylist() {
  el.playlist.innerHTML = "";

  state.playlist.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "playlist-item";
    li.draggable = true;
    li.dataset.index = String(index);

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.textContent = file.name;
    playBtn.className = `playlist-play-btn${index === state.currentIndex ? " active" : ""}`;
    playBtn.addEventListener("click", () => playAtIndex(index));

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "playlist-remove-btn";
    removeBtn.title = `Remove ${file.name}`;
    removeBtn.setAttribute("aria-label", `Remove ${file.name}`);
    removeBtn.innerHTML = "<i class=\"fa-solid fa-xmark\" aria-hidden=\"true\"></i>";
    removeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removePlaylistItem(index);
    });

    li.addEventListener("dragstart", () => {
      state.draggedPlaylistIndex = index;
      li.classList.add("is-dragging");
    });

    li.addEventListener("dragover", (event) => {
      event.preventDefault();
      li.classList.add("is-drop-target");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("is-drop-target");
    });

    li.addEventListener("drop", (event) => {
      event.preventDefault();
      li.classList.remove("is-drop-target");
      if (state.draggedPlaylistIndex == null || state.draggedPlaylistIndex === index) {
        return;
      }
      movePlaylistItem(state.draggedPlaylistIndex, index);
    });

    li.addEventListener("dragend", () => {
      state.draggedPlaylistIndex = null;
      li.classList.remove("is-dragging");
      el.playlist.querySelectorAll(".is-drop-target").forEach((item) => item.classList.remove("is-drop-target"));
    });

    li.appendChild(playBtn);
    li.appendChild(removeBtn);
    el.playlist.appendChild(li);
  });
}

function movePlaylistItem(fromIndex, toIndex) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= state.playlist.length || toIndex >= state.playlist.length) {
    return;
  }

  const [moved] = state.playlist.splice(fromIndex, 1);
  state.playlist.splice(toIndex, 0, moved);

  if (state.currentIndex === fromIndex) {
    state.currentIndex = toIndex;
  } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
    state.currentIndex -= 1;
  } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
    state.currentIndex += 1;
  }

  renderPlaylist();
  setStatus("Playlist reordered.");
}

function removePlaylistItem(index) {
  if (index < 0 || index >= state.playlist.length) {
    return;
  }

  if (index === state.currentIndex) {
    removeCurrent();
    return;
  }

  state.playlist.splice(index, 1);
  if (index < state.currentIndex) {
    state.currentIndex -= 1;
  }

  renderPlaylist();
  setStatus("Removed item from playlist.");
}

function playAtIndex(index) {
  const file = state.playlist[index];
  if (!file) {
    return;
  }

  releaseCurrentUrl();
  resetSectionState();
  state.containerSections = [];
  state.sectionHintShownForCurrentMedia = false;
  state.currentIndex = index;
  state.currentObjectUrl = URL.createObjectURL(file);
  state.subtitleLoadToken += 1;
  resetExternalSubtitleState();
  el.video.src = state.currentObjectUrl;
  prepareSeekThumbnailSource(file);
  applyTimingForFile(file);
  updateNowPlayingLabel(file.name);
  void updateAudioCoverForFile(file);
  updateTrackSelectors();
  refreshAutoSubtitleMatches();
  void autoLoadMatchingSubtitleForMedia(file);
  void resolveContainerSectionsForFile(file);
  scheduleSectionRefresh();
  startSectionPolling();

  const storedPosition = state.positions[getFileFingerprint(file)] || 0;
  if (state.settings.rememberPosition && storedPosition > 0) {
    el.video.addEventListener("loadedmetadata", () => {
      el.video.currentTime = Math.min(storedPosition, el.video.duration || storedPosition);
    }, { once: true });
  }

  el.video.play().catch(() => {
    setStatus("Autoplay blocked by browser. Press Play to start.");
  });

  markRecentPlaylistItemPlayed(getFileFingerprint(file));
  renderPlaylist();
}

function togglePlayPause() {
  if (!el.video.src) {
    if (state.playlist.length) {
      playAtIndex(0);
    }
    return;
  }

  if (el.video.paused) {
    resumeAudioDelayContext();
    state.player?.play?.();
    if (!state.player) {
      el.video.play();
    }
  } else {
    state.player?.pause?.();
    if (!state.player) {
      el.video.pause();
    }
  }

  syncPlayButtonLabel();
}

function stopPlayback() {
  state.player?.pause?.();
  if (!state.player) {
    el.video.pause();
  }
  el.video.currentTime = 0;
  syncPlayButtonLabel();
}

function playPrevious() {
  if (!state.playlist.length) {
    return;
  }
  const nextIndex = (state.currentIndex - 1 + state.playlist.length) % state.playlist.length;
  playAtIndex(nextIndex);
}

function playNext() {
  if (!state.playlist.length) {
    return;
  }
  const nextIndex = getNextPlaylistIndex({ allowWrap: true });
  if (nextIndex < 0) {
    return;
  }
  playAtIndex(nextIndex);
}

function getNextPlaylistIndex(options = {}) {
  const { allowWrap = false } = options;
  if (!state.playlist.length) {
    return -1;
  }

  if (state.settings.playlistShuffle && state.playlist.length > 1) {
    const max = state.playlist.length;
    let next = Math.floor(Math.random() * max);
    if (next === state.currentIndex) {
      next = (next + 1) % max;
    }
    return next;
  }

  const sequential = state.currentIndex + 1;
  if (sequential < state.playlist.length) {
    return sequential;
  }

  if (allowWrap || state.settings.playlistRepeatMode === "all") {
    return 0;
  }

  return -1;
}

function onSeekInput() {
  if (!Number.isFinite(el.video.duration)) {
    return;
  }
  const value = Number(el.seekInput.value);
  el.video.currentTime = (value / 100) * el.video.duration;
}

function onVolumeInput() {
  el.video.volume = Number(el.volumeInput.value);
  persistVolumeSetting();
}

function onSpeedChange() {
  el.video.playbackRate = Number(el.speedSelect.value);
  persistSpeedSetting();
}

function onVideoVolumeChanged() {
  el.volumeInput.value = String(el.video.volume);
  persistVolumeSetting();
}

function onVideoRateChanged() {
  const rate = Number(el.video.playbackRate || 1);
  if ([...el.speedSelect.options].some((o) => Number(o.value) === rate)) {
    el.speedSelect.value = String(rate);
  }
  persistSpeedSetting();
}

function onLoadedMetadata() {
  updateTimeUi();
  syncPlayButtonLabel();
  updateTrackSelectors();
  applyVideoPresentation();
  state.subtitleCueIndex = 0;
  scheduleSectionRefresh();
  startSectionPolling();
}

function onTimeUpdate() {
  updateTimeUi();
  renderSubtitleCue();
  enforceABLoop();
  syncSectionNavigationState();
  persistPosition();
}

function onEnded() {
  if (state.settings.playlistRepeatMode === "one") {
    el.video.currentTime = 0;
    el.video.play().catch(() => {
      setStatus("Autoplay blocked by browser. Press Play to continue.");
    });
    return;
  }

  const shouldAdvance = state.settings.autoplayNext
    || state.settings.playlistShuffle
    || state.settings.playlistRepeatMode === "all";

  if (shouldAdvance && state.playlist.length > 1) {
    playNext();
  }
}

function togglePlaylistShuffle() {
  state.settings.playlistShuffle = !state.settings.playlistShuffle;
  saveSettings();
  updatePlaylistModeButtons();
  setStatus(`Shuffle ${state.settings.playlistShuffle ? "enabled" : "disabled"}.`);
}

function cyclePlaylistRepeatMode() {
  const sequence = ["off", "all", "one"];
  const currentIndex = sequence.indexOf(state.settings.playlistRepeatMode);
  state.settings.playlistRepeatMode = sequence[(Math.max(0, currentIndex) + 1) % sequence.length];
  saveSettings();
  updatePlaylistModeButtons();
  const labels = {
    off: "Repeat off",
    all: "Repeat all",
    one: "Repeat one"
  };
  setStatus(labels[state.settings.playlistRepeatMode]);
}

function updatePlaylistModeButtons() {
  if (el.shuffleBtn) {
    const isActive = Boolean(state.settings.playlistShuffle);
    el.shuffleBtn.classList.toggle("is-active", isActive);
    el.shuffleBtn.title = isActive ? "Shuffle enabled" : "Shuffle disabled";
    el.shuffleBtn.setAttribute("aria-label", el.shuffleBtn.title);
  }

  if (el.repeatBtn) {
    const mode = ["off", "all", "one"].includes(state.settings.playlistRepeatMode)
      ? state.settings.playlistRepeatMode
      : "off";
    el.repeatBtn.dataset.mode = mode;
    el.repeatBtn.classList.toggle("is-active", mode !== "off");

    const repeatIcon = el.repeatBtn.querySelector("i");
    if (repeatIcon) {
      repeatIcon.className = mode === "one" ? "fa-solid fa-repeat-1" : "fa-solid fa-repeat";
    }

    const titleByMode = {
      off: "Repeat off",
      all: "Repeat all",
      one: "Repeat one"
    };
    el.repeatBtn.title = titleByMode[mode];
    el.repeatBtn.setAttribute("aria-label", titleByMode[mode]);
  }
}

function onMediaError() {
  setStatus("Unable to decode this media file in the current browser. Try MP4 (H.264/AAC) or WebM.");
}

function updateTimeUi() {
  const duration = Number.isFinite(el.video.duration) ? el.video.duration : 0;
  const current = Number.isFinite(el.video.currentTime) ? el.video.currentTime : 0;

  el.currentTimeLabel.textContent = formatTime(current);
  el.durationLabel.textContent = formatTime(duration);

  if (duration > 0) {
    el.seekInput.value = String((current / duration) * 100);
  } else {
    el.seekInput.value = "0";
  }
}

function scheduleSectionRefresh() {
  clearTimeout(scheduleSectionRefresh.timer);
  scheduleSectionRefresh.timer = window.setTimeout(() => {
    refreshSectionsFromMedia();
  }, 120);
}

function refreshSectionsFromMedia(retryCount = 0) {
  const mediaDuration = Number(el.video.duration);
  const inferredDuration = inferDurationFromSections(state.containerSections);
  const duration = Number.isFinite(mediaDuration) && mediaDuration > 0
    ? mediaDuration
    : inferredDuration;

  if (!Number.isFinite(duration) || duration <= 0) {
    resetSectionState();
    return;
  }

  const trackSections = Number.isFinite(mediaDuration) && mediaDuration > 0
    ? extractMediaSections(duration)
    : [];
  const sections = trackSections.length
    ? trackSections
    : normalizeSectionListForDuration(state.containerSections, duration);
  if (!sections.length && retryCount < 8) {
    window.setTimeout(() => refreshSectionsFromMedia(retryCount + 1), 240);
    return;
  }

  if (!sections.length && retryCount >= 8 && !state.sectionHintShownForCurrentMedia) {
    const hasPossibleSectionTracks = el.video.textTracks
      ? Array.from(el.video.textTracks).some((track) => isSectionTrack(track))
      : false;

    if (hasPossibleSectionTracks) {
      setStatus("Chapter track detected, but cues are not exposed yet. Keep playback running; markers will appear when available.");
      state.sectionHintShownForCurrentMedia = true;
    }
  }

  const signature = sections
    .map((section) => `${Math.round(section.start * 10)}:${section.title}`)
    .join("|");

  state.sections = sections;
  if (signature !== state.sectionSignature) {
    state.sectionSignature = signature;
  }

  renderSectionMarkers();
  syncSectionNavigationState();
}

function resetSectionState() {
  state.sections = [];
  state.sectionSignature = "";
  renderSectionMarkers();
  syncSectionNavigationState();
}

async function resolveContainerSectionsForFile(file) {
  if (!file) {
    return;
  }

  const extension = getFileExtension(file.name);
  if (!CHAPTER_METADATA_EXTENSIONS.has(extension)) {
    state.containerSections = [];
    return;
  }

  const fingerprint = getFileFingerprint(file);
  if (Array.isArray(state.chapterSectionsByFingerprint[fingerprint])) {
    state.containerSections = state.chapterSectionsByFingerprint[fingerprint];
    scheduleSectionRefresh();
    return;
  }

  if (state.chapterParseInFlightFingerprint === fingerprint) {
    return;
  }

  state.chapterParseInFlightFingerprint = fingerprint;

  try {
    let sections = [];
    if (extension === "mkv") {
      sections = await extractChaptersFromMkvFile(file);
    } else {
      sections = await extractChaptersFromMp4File(file);
    }

    state.chapterSectionsByFingerprint[fingerprint] = sections;

    if (state.playlist[state.currentIndex] && getFileFingerprint(state.playlist[state.currentIndex]) === fingerprint) {
      state.containerSections = sections;
      scheduleSectionRefresh();
    }
  } catch {
    state.chapterSectionsByFingerprint[fingerprint] = [];
  } finally {
    if (state.chapterParseInFlightFingerprint === fingerprint) {
      state.chapterParseInFlightFingerprint = null;
    }
  }
}

async function extractChaptersFromMp4File(file) {
  const rawBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(rawBuffer);
  const signatures = findAsciiSignatureOffsets(bytes, "chpl");

  for (let i = 0; i < signatures.length; i += 1) {
    const typeOffset = signatures[i];
    if (typeOffset < 4) {
      continue;
    }

    const boxStart = typeOffset - 4;
    const boxSize = readUint32BE(bytes, boxStart);
    if (!Number.isFinite(boxSize) || boxSize < 12) {
      continue;
    }

    const boxEnd = boxStart + boxSize;
    if (boxEnd > bytes.length) {
      continue;
    }

    const payload = bytes.slice(typeOffset + 4, boxEnd);
    const chapters = parseChplPayload(payload);
    if (chapters.length) {
      return chapters;
    }
  }

  return [];
}

async function extractChaptersFromMkvFile(file) {
  const scanSize = Math.min(Number(file.size || 0), MAX_MKV_CHAPTER_SCAN_BYTES);
  if (!scanSize || scanSize < 512) {
    return [];
  }

  const rawBuffer = await file.slice(0, scanSize).arrayBuffer();
  const bytes = new Uint8Array(rawBuffer);
  return extractChaptersFromMkvBytes(bytes);
}

function extractChaptersFromMkvBytes(bytes) {
  const chapterRanges = [];
  walkEbmlRange(bytes, 0, bytes.length, 0, (id, dataStart, dataEnd) => {
    if (id === MKV_IDS.chapters) {
      chapterRanges.push({ start: dataStart, end: dataEnd });
    }
  });

  if (!chapterRanges.length) {
    return [];
  }

  const rawChapters = [];
  chapterRanges.forEach((range) => {
    parseMkvChapterContainer(bytes, range.start, range.end, rawChapters);
  });

  if (!rawChapters.length) {
    return [];
  }

  rawChapters.sort((a, b) => a.start - b.start);

  const unique = [];
  rawChapters.forEach((chapter) => {
    const previous = unique[unique.length - 1];
    if (previous && Math.abs(previous.start - chapter.start) < 0.25) {
      if (previous.title.startsWith("Section") && chapter.title && !chapter.title.startsWith("Section")) {
        previous.title = chapter.title;
      }
      previous.end = Math.max(previous.end, chapter.end);
      return;
    }

    unique.push(chapter);
  });

  for (let i = 0; i < unique.length; i += 1) {
    const current = unique[i];
    const next = unique[i + 1];
    current.end = next ? Math.max(current.start, next.start) : Math.max(current.end, current.start);
  }

  return unique;
}

function walkEbmlRange(bytes, start, end, depth, onElement) {
  if (!bytes || depth > EBML_MAX_RECURSION_DEPTH) {
    return;
  }

  let cursor = Math.max(0, start);
  const safeEnd = Math.min(bytes.length, end);

  while (cursor < safeEnd) {
    const idInfo = readEbmlId(bytes, cursor);
    if (!idInfo) {
      break;
    }

    const sizeInfo = readEbmlSize(bytes, cursor + idInfo.length);
    if (!sizeInfo) {
      break;
    }

    const dataStart = cursor + idInfo.length + sizeInfo.length;
    if (dataStart > safeEnd) {
      break;
    }

    const dataEnd = sizeInfo.isUnknown
      ? safeEnd
      : Math.min(safeEnd, dataStart + sizeInfo.size);

    onElement(idInfo.id, dataStart, dataEnd, depth);

    if (MKV_MASTER_IDS.has(idInfo.id) && dataEnd > dataStart) {
      walkEbmlRange(bytes, dataStart, dataEnd, depth + 1, onElement);
    }

    if (dataEnd <= cursor) {
      break;
    }
    cursor = dataEnd;
  }
}

function parseMkvChapterContainer(bytes, start, end, outSections) {
  walkEbmlRange(bytes, start, end, 0, (id, dataStart, dataEnd) => {
    if (id === MKV_IDS.chapterAtom) {
      parseMkvChapterAtom(bytes, dataStart, dataEnd, outSections);
    }
  });
}

function parseMkvChapterAtom(bytes, start, end, outSections) {
  let cursor = start;
  let chapterStartNs = Number.NaN;
  let chapterEndNs = Number.NaN;
  let title = "";

  while (cursor < end) {
    const idInfo = readEbmlId(bytes, cursor);
    if (!idInfo) {
      break;
    }

    const sizeInfo = readEbmlSize(bytes, cursor + idInfo.length);
    if (!sizeInfo) {
      break;
    }

    const dataStart = cursor + idInfo.length + sizeInfo.length;
    const dataEnd = sizeInfo.isUnknown
      ? end
      : Math.min(end, dataStart + sizeInfo.size);

    if (idInfo.id === MKV_IDS.chapterTimeStart) {
      chapterStartNs = readUnsignedInt(bytes, dataStart, dataEnd);
    } else if (idInfo.id === MKV_IDS.chapterTimeEnd) {
      chapterEndNs = readUnsignedInt(bytes, dataStart, dataEnd);
    } else if (idInfo.id === MKV_IDS.chapterDisplay && !title) {
      title = extractMkvChapterTitle(bytes, dataStart, dataEnd);
    }

    if (dataEnd <= cursor) {
      break;
    }
    cursor = dataEnd;
  }

  if (!Number.isFinite(chapterStartNs) || chapterStartNs < 0) {
    return;
  }

  const startSeconds = chapterStartNs / 1000000000;
  const endSeconds = Number.isFinite(chapterEndNs) && chapterEndNs >= chapterStartNs
    ? chapterEndNs / 1000000000
    : startSeconds;

  outSections.push({
    start: startSeconds,
    end: endSeconds,
    title: sanitizeSectionTitle(title) || `Section ${outSections.length + 1}`
  });
}

function extractMkvChapterTitle(bytes, start, end) {
  let title = "";

  walkEbmlRange(bytes, start, end, 0, (id, dataStart, dataEnd) => {
    if (id !== MKV_IDS.chapterString || title) {
      return;
    }

    title = decodeUtf8(bytes.slice(dataStart, dataEnd)).replace(/\0/g, "").trim();
  });

  return title;
}

function readEbmlId(bytes, offset) {
  if (!bytes || offset < 0 || offset >= bytes.length) {
    return null;
  }

  const first = bytes[offset];
  if (!first) {
    return null;
  }

  const length = getEbmlVintLength(first, 4);
  if (!length || offset + length > bytes.length) {
    return null;
  }

  let id = 0;
  for (let i = 0; i < length; i += 1) {
    id = (id << 8) | bytes[offset + i];
  }

  return { id, length };
}

function readEbmlSize(bytes, offset) {
  if (!bytes || offset < 0 || offset >= bytes.length) {
    return null;
  }

  const first = bytes[offset];
  if (!first) {
    return null;
  }

  const length = getEbmlVintLength(first, 8);
  if (!length || offset + length > bytes.length) {
    return null;
  }

  const markerMask = 1 << (8 - length);
  let sizeBigInt = BigInt(first & (markerMask - 1));
  for (let i = 1; i < length; i += 1) {
    sizeBigInt = (sizeBigInt << 8n) | BigInt(bytes[offset + i]);
  }

  const unknownValue = (1n << BigInt(7 * length)) - 1n;
  if (sizeBigInt === unknownValue) {
    return { size: Number.MAX_SAFE_INTEGER, length, isUnknown: true };
  }

  if (sizeBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return {
    size: Number(sizeBigInt),
    length,
    isUnknown: false
  };
}

function getEbmlVintLength(firstByte, maxLength) {
  let mask = 0x80;
  for (let length = 1; length <= maxLength; length += 1) {
    if (firstByte & mask) {
      return length;
    }
    mask >>= 1;
  }

  return 0;
}

function readUnsignedInt(bytes, start, end) {
  if (!bytes || start < 0 || end <= start || end > bytes.length) {
    return Number.NaN;
  }

  if (end - start > 8) {
    return Number.NaN;
  }

  let value = 0n;
  for (let i = start; i < end; i += 1) {
    value = (value << 8n) | BigInt(bytes[i]);
  }

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number.NaN;
  }

  return Number(value);
}

function parseChplPayload(payload) {
  if (!payload || payload.length < 10) {
    return [];
  }

  const chapterCountOffsets = [8, 4, 9, 5];
  for (let i = 0; i < chapterCountOffsets.length; i += 1) {
    const countOffset = chapterCountOffsets[i];
    if (countOffset >= payload.length) {
      continue;
    }

    const count = payload[countOffset];
    if (!Number.isFinite(count) || count <= 0 || count > 240) {
      continue;
    }

    let cursor = countOffset + 1;
    const sections = [];
    let valid = true;

    for (let chapterIndex = 0; chapterIndex < count; chapterIndex += 1) {
      if (cursor + 9 > payload.length) {
        valid = false;
        break;
      }

      const start100ns = readUint64BE(payload, cursor);
      cursor += 8;
      const titleLength = payload[cursor];
      cursor += 1;

      if (cursor + titleLength > payload.length) {
        valid = false;
        break;
      }

      const titleBytes = payload.slice(cursor, cursor + titleLength);
      cursor += titleLength;

      const start = Number(start100ns) / 10000000;
      if (!Number.isFinite(start) || start < 0) {
        valid = false;
        break;
      }

      const title = decodeUtf8(titleBytes).trim() || `Section ${chapterIndex + 1}`;
      sections.push({ start, end: start, title });
    }

    if (!valid || !sections.length) {
      continue;
    }

    sections.sort((a, b) => a.start - b.start);
    for (let j = 0; j < sections.length; j += 1) {
      const current = sections[j];
      const next = sections[j + 1];
      current.end = next ? next.start : current.start;
    }

    return sections;
  }

  return [];
}

function findAsciiSignatureOffsets(bytes, text) {
  const offsets = [];
  if (!bytes || !text) {
    return offsets;
  }

  const encoded = new TextEncoder().encode(text);
  const limit = bytes.length - encoded.length;
  for (let i = 0; i <= limit; i += 1) {
    let matches = true;
    for (let j = 0; j < encoded.length; j += 1) {
      if (bytes[i + j] !== encoded[j]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      offsets.push(i);
    }
  }

  return offsets;
}

function readUint32BE(bytes, offset) {
  if (!bytes || offset < 0 || offset + 4 > bytes.length) {
    return Number.NaN;
  }

  return ((bytes[offset] << 24) >>> 0)
    + (bytes[offset + 1] << 16)
    + (bytes[offset + 2] << 8)
    + bytes[offset + 3];
}

function readUint64BE(bytes, offset) {
  if (!bytes || offset < 0 || offset + 8 > bytes.length) {
    return 0n;
  }

  return (BigInt(bytes[offset]) << 56n)
    | (BigInt(bytes[offset + 1]) << 48n)
    | (BigInt(bytes[offset + 2]) << 40n)
    | (BigInt(bytes[offset + 3]) << 32n)
    | (BigInt(bytes[offset + 4]) << 24n)
    | (BigInt(bytes[offset + 5]) << 16n)
    | (BigInt(bytes[offset + 6]) << 8n)
    | BigInt(bytes[offset + 7]);
}

function decodeUtf8(bytes) {
  if (!bytes || !bytes.length) {
    return "";
  }

  try {
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    let fallback = "";
    for (let i = 0; i < bytes.length; i += 1) {
      fallback += String.fromCharCode(bytes[i]);
    }
    return fallback;
  }
}

function normalizeSectionListForDuration(sections, duration) {
  if (!Array.isArray(sections) || !sections.length || !Number.isFinite(duration) || duration <= 0) {
    return [];
  }

  const normalized = sections
    .map((section, index) => {
      const start = clamp(Number(section.start || 0), 0, duration);
      const end = Number.isFinite(section.end)
        ? clamp(Number(section.end), start, duration)
        : duration;

      return {
        start,
        end,
        title: sanitizeSectionTitle(section.title) || `Section ${index + 1}`
      };
    })
    .filter((section) => Number.isFinite(section.start) && section.start < duration)
    .sort((a, b) => a.start - b.start);

  return normalized;
}

function inferDurationFromSections(sections) {
  if (!Array.isArray(sections) || !sections.length) {
    return 0;
  }

  let maxTime = 0;
  sections.forEach((section) => {
    const start = Number(section.start || 0);
    const end = Number.isFinite(section.end) ? Number(section.end) : start;
    if (Number.isFinite(start)) {
      maxTime = Math.max(maxTime, start);
    }
    if (Number.isFinite(end)) {
      maxTime = Math.max(maxTime, end);
    }
  });

  return Number.isFinite(maxTime) && maxTime > 0 ? maxTime : 0;
}

function bindSectionTrackObservers() {
  const tracks = el.video.textTracks;
  if (!tracks || state.sectionTrackObserverBound) {
    return;
  }

  const bindTrack = (track) => {
    if (!track || state.sectionTrackBoundSet.has(track)) {
      return;
    }

    state.sectionTrackBoundSet.add(track);
    if (typeof track.addEventListener === "function") {
      track.addEventListener("cuechange", scheduleSectionRefresh);
    }
  };

  Array.from(tracks).forEach(bindTrack);

  if (typeof tracks.addEventListener === "function") {
    tracks.addEventListener("addtrack", (event) => {
      const track = event.track || event.currentTarget?.[event.currentTarget.length - 1];
      bindTrack(track);
      scheduleSectionRefresh();
      startSectionPolling();
    });

    tracks.addEventListener("change", () => {
      scheduleSectionRefresh();
      startSectionPolling();
    });
  }

  state.sectionTrackObserverBound = true;
}

function startSectionPolling() {
  stopSectionPolling();

  let attempts = 0;
  state.sectionPollTimer = window.setInterval(() => {
    attempts += 1;
    refreshSectionsFromMedia();

    if (state.sections.length || attempts >= 30 || state.currentIndex < 0) {
      stopSectionPolling();
    }
  }, 600);
}

function stopSectionPolling() {
  if (!state.sectionPollTimer) {
    return;
  }

  window.clearInterval(state.sectionPollTimer);
  state.sectionPollTimer = null;
}

function isSectionTrack(track) {
  if (!track) {
    return false;
  }

  const kind = String(track.kind || "").toLowerCase();
  const label = String(track.label || "").toLowerCase();
  return kind === "chapters"
    || kind === "metadata"
    || label.includes("chapter")
    || label.includes("section")
    || label.includes("scene")
    || label.includes("part")
    || label.includes("toc");
}

function extractMediaSections(duration) {
  const textTracks = el.video.textTracks ? Array.from(el.video.textTracks) : [];
  const sections = [];

  textTracks.forEach((track) => {
    if (!isSectionTrack(track)) {
      return;
    }

    try {
      if (track.mode === "disabled") {
        track.mode = "hidden";
      }
    } catch {
      // Some tracks cannot be toggled depending on browser implementation.
    }

    const cues = track.cues ? Array.from(track.cues) : [];
    cues.forEach((cue) => {
      const start = clamp(Number(cue.startTime || 0), 0, duration);
      const end = Number.isFinite(cue.endTime)
        ? clamp(Number(cue.endTime), start, duration)
        : duration;

      if (!Number.isFinite(start) || start >= duration) {
        return;
      }

      sections.push({
        start,
        end,
        title: sanitizeSectionTitle(cue.text) || `Section ${sections.length + 1}`
      });
    });
  });

  sections.sort((a, b) => a.start - b.start);

  const unique = [];
  sections.forEach((section) => {
    const previous = unique[unique.length - 1];
    if (previous && Math.abs(previous.start - section.start) < 0.25) {
      previous.end = Math.max(previous.end, section.end);
      if (previous.title.startsWith("Section") && section.title && !section.title.startsWith("Section")) {
        previous.title = section.title;
      }
      return;
    }

    unique.push(section);
  });

  return unique;
}

function sanitizeSectionTitle(rawText) {
  if (!rawText) {
    return "";
  }

  const temp = document.createElement("div");
  temp.innerHTML = String(rawText);
  return (temp.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderSectionMarkers() {
  const progressContainer = state.player?.elements?.controls?.querySelector(".plyr__progress__container");
  if (!progressContainer) {
    return;
  }

  let markerLayer = progressContainer.querySelector(".plyr__section-markers");
  if (!markerLayer) {
    markerLayer = document.createElement("div");
    markerLayer.className = "plyr__section-markers";
    progressContainer.appendChild(markerLayer);
  }

  markerLayer.innerHTML = "";

  const mediaDuration = Number(el.video.duration);
  const duration = Number.isFinite(mediaDuration) && mediaDuration > 0
    ? mediaDuration
    : inferDurationFromSections(state.sections);

  if (!Number.isFinite(duration) || duration <= 0 || !state.sections.length) {
    return;
  }

  state.sections.forEach((section, index) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "plyr__section-marker";
    marker.style.left = `${(section.start / duration) * 100}%`;
    marker.title = `${index + 1}. ${section.title} (${formatTime(section.start)})`;
    marker.setAttribute("aria-label", `Go to section ${index + 1}: ${section.title}`);
    marker.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      jumpToSection(index);
    });
    markerLayer.appendChild(marker);
  });
}

function jumpToSection(index, options = {}) {
  const { announce = true } = options;
  const section = state.sections[index];
  if (!section) {
    return;
  }

  el.video.currentTime = section.start;
  if (announce) {
    setStatus(`Section ${index + 1}: ${section.title}`);
  }
  syncSectionNavigationState();
}

function findPreviousSectionIndex(now) {
  let previousIndex = -1;
  for (let i = 0; i < state.sections.length; i += 1) {
    if (state.sections[i].start < now - SECTION_SYNC_EPSILON) {
      previousIndex = i;
      continue;
    }
    break;
  }
  return previousIndex;
}

function findNextSectionIndex(now) {
  return state.sections.findIndex((section) => section.start > now + SECTION_SYNC_EPSILON);
}

function jumpToAdjacentSection(direction, options = {}) {
  const { announce = true } = options;
  if (!state.sections.length) {
    return false;
  }

  const now = Number(el.video.currentTime || 0);
  const targetIndex = direction < 0
    ? findPreviousSectionIndex(now)
    : findNextSectionIndex(now);

  if (targetIndex < 0) {
    return false;
  }

  jumpToSection(targetIndex, { announce });
  return true;
}

function goToPreviousSection() {
  if (!state.sections.length) {
    setStatus("No sections detected in this file.");
    return;
  }

  const now = Number(el.video.currentTime || 0);
  const previousIndex = findPreviousSectionIndex(now);

  if (previousIndex < 0) {
    setStatus("Already at the first section.");
    return;
  }

  jumpToSection(previousIndex, { announce: true });
}

function goToNextSection() {
  if (!state.sections.length) {
    setStatus("No sections detected in this file.");
    return;
  }

  const now = Number(el.video.currentTime || 0);
  const nextIndex = findNextSectionIndex(now);

  if (nextIndex < 0) {
    setStatus("Already at the last section.");
    return;
  }

  jumpToSection(nextIndex, { announce: true });
}

function syncSectionNavigationState() {
  const prevButton = state.plyrCustomButtons.prevSection;
  const nextButton = state.plyrCustomButtons.nextSection;

  if (!prevButton && !nextButton) {
    return;
  }

  const now = Number(el.video.currentTime || 0);
  const hasPrevious = state.sections.some((section) => section.start < now - SECTION_SYNC_EPSILON);
  const hasNext = state.sections.some((section) => section.start > now + SECTION_SYNC_EPSILON);

  if (prevButton) {
    prevButton.disabled = !hasPrevious;
    prevButton.classList.toggle("is-disabled", !hasPrevious);
  }

  if (nextButton) {
    nextButton.disabled = !hasNext;
    nextButton.classList.toggle("is-disabled", !hasNext);
  }
}

function setA() {
  state.ab.a = el.video.currentTime;
  updateABLabel();
}

function setB() {
  state.ab.b = el.video.currentTime;
  updateABLabel();
}

function clearAB() {
  state.ab = { a: null, b: null, loop: false };
  updateABLabel();
  el.toggleABLoopBtn.textContent = "Loop Off";
}

function toggleABLoop() {
  if (state.ab.a == null || state.ab.b == null || state.ab.b <= state.ab.a) {
    setStatus("Set valid A and B first.");
    return;
  }
  state.ab.loop = !state.ab.loop;
  el.toggleABLoopBtn.textContent = state.ab.loop ? "Loop On" : "Loop Off";
}

function enforceABLoop() {
  const { a, b, loop } = state.ab;
  if (!loop || a == null || b == null) {
    return;
  }
  if (el.video.currentTime >= b) {
    el.video.currentTime = a;
  }
}

function updateABLabel() {
  const aLabel = state.ab.a == null ? "--" : formatTime(state.ab.a);
  const bLabel = state.ab.b == null ? "--" : formatTime(state.ab.b);
  if (el.abLabel) {
    el.abLabel.textContent = `A: ${aLabel} | B: ${bLabel}`;
  }
  syncPlyrCustomButtonState();
}

function applyPlaybackOffset() {
  const offset = Number(el.playbackOffsetInput.value);
  if (!Number.isFinite(offset) || !Number.isFinite(el.video.currentTime)) {
    return;
  }
  const nextTime = Math.max(0, el.video.currentTime + offset);
  el.video.currentTime = nextTime;
}

function onSubtitleOffsetChange() {
  state.settings.subtitleOffset = Number(el.subtitleOffsetInput.value);
  maybeUpdateCurrentTimingPreset();
  saveSettings();
}

function onAudioDelayChange() {
  const nextValue = Number(el.audioDelayInput.value);
  if (!Number.isFinite(nextValue)) {
    return;
  }

  state.settings.audioDelay = clamp(nextValue, -AUDIO_DELAY_MAX_SECONDS, AUDIO_DELAY_MAX_SECONDS);
  maybeUpdateCurrentTimingPreset();
  saveSettings();
  applyAudioDelayProcessing();
  setStatus(`Audio delay: ${state.settings.audioDelay.toFixed(2)}s`);
}

function onUsePerVideoTimingChanged() {
  state.settings.usePerVideoTiming = el.usePerVideoTiming.checked;
  saveSettings();

  if (state.currentIndex >= 0) {
    const file = state.playlist[state.currentIndex];
    if (file) {
      applyTimingForFile(file);
    }
  }
}

function saveCurrentTimingPreset() {
  if (state.currentIndex < 0) {
    setStatus("Load a video first to save a timing preset.");
    return;
  }

  const file = state.playlist[state.currentIndex];
  const key = getFileFingerprint(file);
  state.timingPresets[key] = {
    subtitleOffset: Number(state.settings.subtitleOffset || 0),
    audioDelay: Number(state.settings.audioDelay || 0)
  };

  persistTimingPresets();
  setStatus("Per-video timing preset saved.");
}

function clearCurrentTimingPreset() {
  if (state.currentIndex < 0) {
    return;
  }

  const file = state.playlist[state.currentIndex];
  const key = getFileFingerprint(file);
  if (state.timingPresets[key]) {
    delete state.timingPresets[key];
    persistTimingPresets();
    setStatus("Per-video timing preset removed.");
  }
}

function maybeUpdateCurrentTimingPreset() {
  if (!state.settings.usePerVideoTiming || state.currentIndex < 0) {
    return;
  }

  const file = state.playlist[state.currentIndex];
  if (!file) {
    return;
  }

  const key = getFileFingerprint(file);
  if (!state.timingPresets[key]) {
    return;
  }

  state.timingPresets[key] = {
    subtitleOffset: Number(state.settings.subtitleOffset || 0),
    audioDelay: Number(state.settings.audioDelay || 0)
  };
  persistTimingPresets();
}

function applyTimingForFile(file) {
  const key = getFileFingerprint(file);
  const preset = state.timingPresets[key];

  if (state.settings.usePerVideoTiming && preset) {
    state.settings.subtitleOffset = Number(preset.subtitleOffset || 0);
    state.settings.audioDelay = clamp(Number(preset.audioDelay || 0), -AUDIO_DELAY_MAX_SECONDS, AUDIO_DELAY_MAX_SECONDS);
    el.subtitleOffsetInput.value = String(state.settings.subtitleOffset);
    el.audioDelayInput.value = String(state.settings.audioDelay);
    saveSettings();
    setStatus("Applied per-video timing preset.");
  } else {
    el.subtitleOffsetInput.value = String(Number(state.settings.subtitleOffset || 0));
    state.settings.audioDelay = clamp(Number(state.settings.audioDelay || 0), -AUDIO_DELAY_MAX_SECONDS, AUDIO_DELAY_MAX_SECONDS);
    el.audioDelayInput.value = String(state.settings.audioDelay);
  }

  applyAudioDelayProcessing();
}

function persistTimingPresets() {
  localStorage.setItem(TIMING_PRESETS_KEY, JSON.stringify(state.timingPresets));
}

function onSubtitleStyleChanged() {
  state.settings.subtitleFontSize = clamp(Number(el.subtitleSizeInput.value), 14, 44);
  state.settings.subtitlePositionPercent = clamp(Number(el.subtitlePositionInput.value), 2, 30);
  state.settings.subtitleBgOpacity = clamp(Number(el.subtitleBgOpacityInput.value), 0, 0.9);
  applySubtitleStyle();
  saveSettings();
}

function applySubtitleStyle() {
  document.documentElement.style.setProperty("--subtitle-font-size", `${Number(state.settings.subtitleFontSize || 22)}px`);
  document.documentElement.style.setProperty("--subtitle-bottom", `${Number(state.settings.subtitlePositionPercent || 7)}%`);
  document.documentElement.style.setProperty("--subtitle-bg-opacity", String(Number(state.settings.subtitleBgOpacity || 0.3)));

  el.subtitleSizeInput.value = String(Number(state.settings.subtitleFontSize || 22));
  el.subtitlePositionInput.value = String(Number(state.settings.subtitlePositionPercent || 7));
  el.subtitleBgOpacityInput.value = String(Number(state.settings.subtitleBgOpacity || 0.3));
}

function renderSubtitleCue() {
  if (!state.settings.showSubtitlesByDefault || !state.subtitleCues.length) {
    hideSubtitleOverlay();
    return;
  }

  const timelineTime = el.video.currentTime + Number(state.settings.subtitleOffset || 0);
  let idx = state.subtitleCueIndex;
  idx = Math.min(Math.max(idx, 0), state.subtitleCues.length - 1);

  while (idx < state.subtitleCues.length - 1 && timelineTime > state.subtitleCues[idx].end) {
    idx += 1;
  }

  while (idx > 0 && timelineTime < state.subtitleCues[idx].start) {
    idx -= 1;
  }

  state.subtitleCueIndex = idx;
  const active = state.subtitleCues[idx];

  if (!active || timelineTime < active.start || timelineTime > active.end) {
    hideSubtitleOverlay();
    return;
  }

  el.subtitleOverlay.innerHTML = active.text.replace(/\n/g, "<br>");
  el.subtitleOverlay.classList.remove("hidden");
}

function hideSubtitleOverlay() {
  if (!el.subtitleOverlay) {
    return;
  }

  el.subtitleOverlay.textContent = "";
  el.subtitleOverlay.classList.add("hidden");
}

function resetExternalSubtitleState() {
  state.subtitleCues = [];
  state.subtitleCueIndex = 0;
  state.loadedSubtitleFingerprint = null;
  hideSubtitleOverlay();
}

function clearPlaylist() {
  exitFloatingModeIfActive();
  releaseCurrentUrl();
  state.playlist = [];
  state.currentIndex = -1;
  state.autoSubtitleByMediaFingerprint = {};
  clearAudioCoverThumbnail();
  stopSectionPolling();
  el.video.removeAttribute("src");
  el.video.load();
  resetSectionState();
  renderPlaylist();
  updateNowPlayingLabel("No media loaded");
  setStatus("Playlist cleared.");
}

function removeCurrent() {
  if (state.currentIndex < 0) {
    return;
  }

  state.playlist.splice(state.currentIndex, 1);
  if (!state.playlist.length) {
    exitFloatingModeIfActive();
  }
  releaseCurrentUrl();

  if (!state.playlist.length) {
    state.currentIndex = -1;
    state.autoSubtitleByMediaFingerprint = {};
    clearAudioCoverThumbnail();
    stopSectionPolling();
    el.video.removeAttribute("src");
    el.video.load();
    resetSectionState();
    updateNowPlayingLabel("No media loaded");
  } else {
    const nextIndex = Math.min(state.currentIndex, state.playlist.length - 1);
    playAtIndex(nextIndex);
  }

  renderPlaylist();
}

function createPlaylistManifestEntry(file) {
  return {
    name: file.name,
    size: Number(file.size || 0),
    type: String(file.type || ""),
    lastModified: Number(file.lastModified || 0),
    fingerprint: getFileFingerprint(file)
  };
}

function savePlaylistToFile() {
  if (!Array.isArray(state.playlist) || !state.playlist.length) {
    setStatus("Playlist is empty. Add media before saving a playlist file.");
    return;
  }

  const manifest = {
    schema: "lvp.playlist.v1",
    exportedAt: new Date().toISOString(),
    currentIndex: state.currentIndex,
    entries: state.playlist.map((file) => createPlaylistManifestEntry(file))
  };

  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `local-video-player-playlist-${new Date().toISOString().slice(0, 10)}.lvpplaylist.json`;
  anchor.click();
  URL.revokeObjectURL(url);

  setStatus(`Saved playlist file with ${manifest.entries.length} item${manifest.entries.length === 1 ? "" : "s"}.`);
}

function normalizePlaylistManifestEntries(rawManifest) {
  const manifest = rawManifest && typeof rawManifest === "object" ? rawManifest : {};

  if (Array.isArray(manifest)) {
    return manifest;
  }

  if (Array.isArray(manifest.entries)) {
    return manifest.entries;
  }

  if (Array.isArray(manifest.files)) {
    return manifest.files;
  }

  return [];
}

function normalizeImportedPlaylistEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") {
    return null;
  }

  const name = String(rawEntry.name || "").trim();
  const size = Number(rawEntry.size || 0);
  const type = String(rawEntry.type || "");
  const lastModified = Number(rawEntry.lastModified || 0);
  let fingerprint = String(rawEntry.fingerprint || "").trim();

  if (!name) {
    return null;
  }

  if (!fingerprint) {
    fingerprint = `${name}:${size}:${lastModified}`;
  }

  return {
    name,
    size: Number.isFinite(size) ? size : 0,
    type,
    lastModified: Number.isFinite(lastModified) ? lastModified : 0,
    fingerprint
  };
}

async function importPlaylistFile(event) {
  const file = event.target?.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rawEntries = normalizePlaylistManifestEntries(parsed);
    const entries = rawEntries
      .map((rawEntry) => normalizeImportedPlaylistEntry(rawEntry))
      .filter(Boolean);

    if (!entries.length) {
      setStatus("Playlist file has no importable entries.");
      return;
    }

    await loadPlaylistFromManifestEntries(entries);
  } catch {
    setStatus("Unable to parse playlist file.");
  } finally {
    event.target.value = "";
  }
}

async function loadPlaylistFromManifestEntries(entries) {
  const existingFingerprints = new Set(state.playlist.map((playlistFile) => getFileFingerprint(playlistFile)));
  const importedFingerprints = new Set();
  const filesToAdd = [];
  let unavailableCount = 0;
  let duplicateCount = 0;

  for (const entry of entries) {
    const fingerprint = entry.fingerprint;
    if (!fingerprint || importedFingerprints.has(fingerprint) || existingFingerprints.has(fingerprint)) {
      duplicateCount += 1;
      continue;
    }

    const handle = await loadRecentHandle(fingerprint);
    if (!handle) {
      unavailableCount += 1;
      continue;
    }

    const permission = await ensureReadPermission(handle);
    if (permission !== "granted") {
      unavailableCount += 1;
      continue;
    }

    try {
      const mediaFile = await handle.getFile();
      const resolvedFingerprint = getFileFingerprint(mediaFile);
      await storeRecentHandle(resolvedFingerprint, handle);

      if (existingFingerprints.has(resolvedFingerprint) || importedFingerprints.has(resolvedFingerprint)) {
        duplicateCount += 1;
        continue;
      }

      filesToAdd.push(mediaFile);
      importedFingerprints.add(resolvedFingerprint);
    } catch {
      unavailableCount += 1;
    }
  }

  if (filesToAdd.length) {
    addFilesToPlaylist(filesToAdd, { sourceLabel: "Imported playlist" });
  }

  if (!filesToAdd.length) {
    setStatus("No files from the playlist file could be restored. Ensure files were previously opened so handles are available.");
    return;
  }

  setStatus(`Imported ${filesToAdd.length} playlist file${filesToAdd.length === 1 ? "" : "s"}${duplicateCount ? `, skipped ${duplicateCount} duplicate` : ""}${unavailableCount ? `, ${unavailableCount} unavailable` : ""}.`);
}

async function deleteRecentHandle(fingerprint) {
  if (!fingerprint) {
    return;
  }

  const db = await getHandleDb();
  if (!db) {
    return;
  }

  await new Promise((resolve) => {
    try {
      const tx = db.transaction(HANDLES_STORE_NAME, "readwrite");
      tx.objectStore(HANDLES_STORE_NAME).delete(fingerprint);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function persistRecentPlaylists() {
  localStorage.setItem(RECENT_PLAYLISTS_KEY, JSON.stringify(state.recentPlaylists));
}

function createRecentPlaylistEntry(files, sourceLabel) {
  const nowIso = new Date().toISOString();
  const safeFiles = Array.isArray(files) ? files : [];

  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    addedAt: nowIso,
    sourceLabel: sourceLabel || "Playlist batch",
    files: safeFiles.map((file) => {
      const fingerprint = getFileFingerprint(file);
      return {
        name: file.name,
        size: Number(file.size || 0),
        type: String(file.type || ""),
        lastModified: Number(file.lastModified || 0),
        fingerprint,
        hasHandle: Boolean(state.fileHandleByFingerprint[fingerprint]),
        played: false
      };
    })
  };
}

function rememberRecentPlaylistBatch(files, sourceLabel) {
  if (!state.settings.rememberLastFile || !Array.isArray(files) || !files.length) {
    return;
  }

  const entry = createRecentPlaylistEntry(files, sourceLabel);
  if (!entry.files.length) {
    return;
  }

  state.recentPlaylists = [entry, ...state.recentPlaylists].slice(0, 24);
  persistRecentPlaylists();
  renderRecentFiles();
}

function markRecentPlaylistItemPlayed(fingerprint) {
  if (!fingerprint) {
    return;
  }

  let changed = false;
  state.recentPlaylists.forEach((playlistEntry) => {
    if (!Array.isArray(playlistEntry.files)) {
      return;
    }

    playlistEntry.files.forEach((fileEntry) => {
      if (fileEntry.fingerprint !== fingerprint || fileEntry.played) {
        return;
      }

      fileEntry.played = true;
      changed = true;
    });
  });

  if (!changed) {
    return;
  }

  persistRecentPlaylists();
  renderRecentFiles();
}

function getRecentPlaylistStats(playlistEntry) {
  const fileEntries = Array.isArray(playlistEntry?.files) ? playlistEntry.files : [];
  const totalCount = fileEntries.length;
  const playedCount = fileEntries.reduce((count, fileEntry) => count + (fileEntry.played ? 1 : 0), 0);
  const unplayedCount = Math.max(0, totalCount - playedCount);
  return { totalCount, playedCount, unplayedCount };
}

function isVideoLikeRecentEntry(fileEntry) {
  if (!fileEntry) {
    return false;
  }

  const mimeType = String(fileEntry.type || "").toLowerCase();
  if (mimeType.startsWith("video/")) {
    return true;
  }

  const extension = getFileExtension(fileEntry.name || "");
  return ["mp4", "webm", "mov", "mkv", "avi", "m4v"].includes(extension);
}

function getRecentBatchVideoCount(playlistEntry) {
  const fileEntries = Array.isArray(playlistEntry?.files) ? playlistEntry.files : [];
  return fileEntries.reduce((count, fileEntry) => count + (isVideoLikeRecentEntry(fileEntry) ? 1 : 0), 0);
}

function isRecentBatchExpandable(playlistEntry) {
  return getRecentBatchVideoCount(playlistEntry) >= 2;
}

function isRecentBatchExpanded(entryId) {
  return Boolean(state.ui.recentBatchExpanded?.[entryId]);
}

function setRecentBatchExpanded(entryId, expanded) {
  if (!entryId) {
    return;
  }

  if (!state.ui.recentBatchExpanded || typeof state.ui.recentBatchExpanded !== "object") {
    state.ui.recentBatchExpanded = {};
  }

  if (expanded) {
    state.ui.recentBatchExpanded[entryId] = true;
  } else if (state.ui.recentBatchExpanded[entryId]) {
    delete state.ui.recentBatchExpanded[entryId];
  }

  persistUiState();
  renderRecentFiles();
}

function toggleRecentBatchExpanded(entryId) {
  setRecentBatchExpanded(entryId, !isRecentBatchExpanded(entryId));
}

function setAllRecentBatchExpansion(expanded) {
  if (!Array.isArray(state.recentPlaylists) || !state.recentPlaylists.length) {
    return;
  }

  if (!state.ui.recentBatchExpanded || typeof state.ui.recentBatchExpanded !== "object") {
    state.ui.recentBatchExpanded = {};
  }

  state.recentPlaylists.forEach((playlistEntry) => {
    if (!isRecentBatchExpandable(playlistEntry)) {
      return;
    }

    if (expanded) {
      state.ui.recentBatchExpanded[playlistEntry.id] = true;
    } else {
      delete state.ui.recentBatchExpanded[playlistEntry.id];
    }
  });

  persistUiState();
  renderRecentFiles();
}

function renderRecentFiles() {
  if (!el.recentFiles) {
    return;
  }

  if (!state.ui.recentBatchExpanded || typeof state.ui.recentBatchExpanded !== "object") {
    state.ui.recentBatchExpanded = {};
  }

  const activeBatchIds = new Set((state.recentPlaylists || []).map((entry) => entry.id));
  Object.keys(state.ui.recentBatchExpanded).forEach((entryId) => {
    if (!activeBatchIds.has(entryId)) {
      delete state.ui.recentBatchExpanded[entryId];
    }
  });

  el.recentFiles.innerHTML = "";

  if (Array.isArray(state.recentPlaylists) && state.recentPlaylists.length) {
    const expandableCount = state.recentPlaylists.reduce((count, playlistEntry) => count + (isRecentBatchExpandable(playlistEntry) ? 1 : 0), 0);
    if (el.recentFoldAllBtn) {
      el.recentFoldAllBtn.disabled = expandableCount === 0;
    }
    if (el.recentUnfoldAllBtn) {
      el.recentUnfoldAllBtn.disabled = expandableCount === 0;
    }

    state.recentPlaylists.forEach((playlistEntry) => {
      const stats = getRecentPlaylistStats(playlistEntry);
      const hasExpandableDetails = isRecentBatchExpandable(playlistEntry);
      const isExpanded = hasExpandableDetails && isRecentBatchExpanded(playlistEntry.id);
      const li = document.createElement("li");
      li.className = "recent-item recent-batch-item";

      const openAllBtn = document.createElement("button");
      openAllBtn.type = "button";
      openAllBtn.className = "recent-open-btn recent-batch-open-btn";
      openAllBtn.addEventListener("click", () => {
        void openRecentPlaylistBatch(playlistEntry, { unplayedOnly: false });
      });

      const title = document.createElement("span");
      title.className = "recent-main";
      title.textContent = `${playlistEntry.sourceLabel || "Playlist batch"} - ${stats.totalCount} file${stats.totalCount === 1 ? "" : "s"}`;

      const date = new Date(playlistEntry.addedAt || Date.now()).toLocaleString();
      const meta = document.createElement("span");
      meta.className = "recent-meta";
      meta.textContent = `${date} - Played ${stats.playedCount}/${stats.totalCount}`;

      const badge = document.createElement("span");
      badge.className = "recent-badge";
      badge.textContent = `${stats.unplayedCount} unplayed`;

      openAllBtn.appendChild(title);
      openAllBtn.appendChild(meta);
      openAllBtn.appendChild(badge);

      const actions = document.createElement("div");
      actions.className = "recent-batch-actions";

      if (hasExpandableDetails) {
        const detailsToggleBtn = document.createElement("button");
        detailsToggleBtn.type = "button";
        detailsToggleBtn.className = "btn secondary recent-batch-action-btn";
        detailsToggleBtn.textContent = isExpanded ? "Fold files" : "Unfold files";
        detailsToggleBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleRecentBatchExpanded(playlistEntry.id);
        });
        actions.appendChild(detailsToggleBtn);
      }

      const openUnplayedBtn = document.createElement("button");
      openUnplayedBtn.type = "button";
      openUnplayedBtn.className = "btn secondary recent-batch-action-btn";
      openUnplayedBtn.textContent = "Open Unplayed";
      openUnplayedBtn.disabled = stats.unplayedCount <= 0;
      openUnplayedBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void openRecentPlaylistBatch(playlistEntry, { unplayedOnly: true });
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "recent-remove-btn";
      removeBtn.title = "Remove this playlist batch from recent files";
      removeBtn.setAttribute("aria-label", "Remove this playlist batch from recent files");
      removeBtn.innerHTML = "<i class=\"fa-solid fa-xmark\" aria-hidden=\"true\"></i>";
      removeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeRecentPlaylistEntry(playlistEntry.id);
      });

      actions.appendChild(openUnplayedBtn);
      actions.appendChild(removeBtn);

      li.appendChild(openAllBtn);
      li.appendChild(actions);

      if (hasExpandableDetails) {
        const filesList = document.createElement("ul");
        filesList.className = "recent-batch-file-list";
        filesList.hidden = !isExpanded;

        playlistEntry.files.forEach((fileEntry) => {
          const fileItem = document.createElement("li");
          fileItem.className = "recent-batch-file-item";

          const name = document.createElement("span");
          name.className = "recent-batch-file-name";
          name.textContent = fileEntry.name || "Unnamed file";

          const stateTag = document.createElement("span");
          stateTag.className = `recent-batch-file-state${fileEntry.played ? " is-played" : ""}`;
          stateTag.textContent = fileEntry.played ? "Played" : "Unplayed";

          fileItem.appendChild(name);
          fileItem.appendChild(stateTag);
          filesList.appendChild(fileItem);
        });

        li.appendChild(filesList);
      }

      el.recentFiles.appendChild(li);
    });

    return;
  }

  if (el.recentFoldAllBtn) {
    el.recentFoldAllBtn.disabled = true;
  }
  if (el.recentUnfoldAllBtn) {
    el.recentUnfoldAllBtn.disabled = true;
  }

  state.recentFiles.forEach((item) => {
    const li = document.createElement("li");
    li.className = "recent-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "recent-open-btn";
    btn.addEventListener("click", () => {
      void openLegacyRecentFile(item);
    });

    const title = document.createElement("span");
    title.className = "recent-main";
    title.textContent = item.name;

    const date = new Date(item.lastOpenedAt).toLocaleString();
    const meta = document.createElement("span");
    meta.className = "recent-meta";
    meta.textContent = date;

    const badge = document.createElement("span");
    badge.className = "recent-badge";
    badge.textContent = item.hasHandle ? "Direct" : "Meta";

    btn.appendChild(title);
    btn.appendChild(meta);
    btn.appendChild(badge);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "recent-remove-btn";
    removeBtn.title = `Remove ${item.name} from recent files`;
    removeBtn.setAttribute("aria-label", `Remove ${item.name} from recent files`);
    removeBtn.innerHTML = "<i class=\"fa-solid fa-xmark\" aria-hidden=\"true\"></i>";
    removeBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await removeLegacyRecentFileEntry(item.fingerprint);
    });

    li.appendChild(btn);
    li.appendChild(removeBtn);
    el.recentFiles.appendChild(li);
  });
}

function removeRecentPlaylistEntry(entryId) {
  if (!entryId) {
    return;
  }

  state.recentPlaylists = state.recentPlaylists.filter((entry) => entry.id !== entryId);
  if (state.ui.recentBatchExpanded && state.ui.recentBatchExpanded[entryId]) {
    delete state.ui.recentBatchExpanded[entryId];
    persistUiState();
  }
  persistRecentPlaylists();
  renderRecentFiles();
  setStatus("Removed recent playlist batch.");
}

async function openRecentPlaylistBatch(playlistEntry, options = {}) {
  const { unplayedOnly = false } = options;
  if (!playlistEntry || !Array.isArray(playlistEntry.files)) {
    return;
  }

  const targetEntries = playlistEntry.files.filter((fileEntry) => !unplayedOnly || !fileEntry.played);
  if (!targetEntries.length) {
    setStatus("No matching files in this recent playlist batch.");
    return;
  }

  const filesToAdd = [];
  let unavailableCount = 0;
  let alreadyInPlaylistCount = 0;
  let changed = false;

  for (const fileEntry of targetEntries) {
    const inPlaylist = state.playlist.some((file) => getFileFingerprint(file) === fileEntry.fingerprint);
    if (inPlaylist) {
      alreadyInPlaylistCount += 1;
      continue;
    }

    const handle = await loadRecentHandle(fileEntry.fingerprint);
    if (!handle) {
      unavailableCount += 1;
      continue;
    }

    const permission = await ensureReadPermission(handle);
    if (permission !== "granted") {
      unavailableCount += 1;
      continue;
    }

    try {
      const file = await handle.getFile();
      const fingerprint = getFileFingerprint(file);
      await storeRecentHandle(fingerprint, handle);

      filesToAdd.push(file);
      if (fileEntry.fingerprint !== fingerprint) {
        fileEntry.fingerprint = fingerprint;
        changed = true;
      }
      if (!fileEntry.hasHandle) {
        fileEntry.hasHandle = true;
        changed = true;
      }
    } catch {
      unavailableCount += 1;
    }
  }

  if (filesToAdd.length) {
    addFilesToPlaylist(filesToAdd, {
      suppressRecentBatch: true,
      sourceLabel: "Recent playlist"
    });
  }

  if (changed) {
    persistRecentPlaylists();
  }

  if (!filesToAdd.length) {
    setStatus("No files could be reopened from this recent playlist batch.");
    return;
  }

  const scopeLabel = unplayedOnly ? "unplayed files" : "files";
  setStatus(`Reopened ${filesToAdd.length} ${scopeLabel}${alreadyInPlaylistCount ? `, skipped ${alreadyInPlaylistCount} already in playlist` : ""}${unavailableCount ? `, ${unavailableCount} unavailable` : ""}.`);
}

async function removeLegacyRecentFileEntry(fingerprint) {
  if (!fingerprint) {
    return;
  }

  state.recentFiles = state.recentFiles.filter((item) => item.fingerprint !== fingerprint);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(state.recentFiles));

  if (state.fileHandleByFingerprint[fingerprint]) {
    delete state.fileHandleByFingerprint[fingerprint];
  }

  await deleteRecentHandle(fingerprint);
  renderRecentFiles();
  setStatus("Removed legacy recent file entry.");
}

async function openLegacyRecentFile(item) {
  if (!item) {
    return;
  }

  const existingIndex = state.playlist.findIndex((file) => getFileFingerprint(file) === item.fingerprint);
  if (existingIndex >= 0) {
    playAtIndex(existingIndex);
    return;
  }

  const handle = await loadRecentHandle(item.fingerprint);
  if (!handle) {
    setStatus("This recent item has metadata only. Re-open it with Open once to enable direct launch.");
    return;
  }

  try {
    const permission = await ensureReadPermission(handle);
    if (permission !== "granted") {
      setStatus("Recent file permission was denied.");
      return;
    }

    const file = await handle.getFile();
    const currentFingerprint = getFileFingerprint(file);
    await storeRecentHandle(currentFingerprint, handle);

    if (currentFingerprint !== item.fingerprint) {
      item.fingerprint = currentFingerprint;
      localStorage.setItem(RECENTS_KEY, JSON.stringify(state.recentFiles));
    }

    state.playlist.push(file);
    renderPlaylist();
    playAtIndex(state.playlist.length - 1);
  } catch {
    setStatus("Unable to open this recent file. It may have moved or no longer be accessible.");
  }
}

function supportsDirectFileReopen() {
  return typeof window.showOpenFilePicker === "function" && typeof indexedDB !== "undefined";
}

async function storeRecentHandle(fingerprint, handle) {
  if (!fingerprint || !handle) {
    return;
  }

  state.fileHandleByFingerprint[fingerprint] = handle;

  let recentPlaylistsChanged = false;
  state.recentPlaylists.forEach((playlistEntry) => {
    if (!Array.isArray(playlistEntry.files)) {
      return;
    }

    playlistEntry.files.forEach((fileEntry) => {
      if (fileEntry.fingerprint === fingerprint && !fileEntry.hasHandle) {
        fileEntry.hasHandle = true;
        recentPlaylistsChanged = true;
      }
    });
  });

  if (recentPlaylistsChanged) {
    persistRecentPlaylists();
    renderRecentFiles();
  }

  const db = await getHandleDb();
  if (!db) {
    return;
  }

  await new Promise((resolve) => {
    try {
      const tx = db.transaction(HANDLES_STORE_NAME, "readwrite");
      tx.objectStore(HANDLES_STORE_NAME).put(handle, fingerprint);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function loadRecentHandle(fingerprint) {
  if (!fingerprint) {
    return null;
  }

  if (state.fileHandleByFingerprint[fingerprint]) {
    return state.fileHandleByFingerprint[fingerprint];
  }

  const db = await getHandleDb();
  if (!db) {
    return null;
  }

  const handle = await new Promise((resolve) => {
    try {
      const tx = db.transaction(HANDLES_STORE_NAME, "readonly");
      const req = tx.objectStore(HANDLES_STORE_NAME).get(fingerprint);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  if (handle) {
    state.fileHandleByFingerprint[fingerprint] = handle;
  }

  return handle;
}

function getHandleDb() {
  if (state.handleDbPromise) {
    return state.handleDbPromise;
  }

  state.handleDbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(HANDLES_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(HANDLES_STORE_NAME)) {
          db.createObjectStore(HANDLES_STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return state.handleDbPromise;
}

async function ensureReadPermission(handle) {
  try {
    if (typeof handle.queryPermission === "function") {
      const permission = await handle.queryPermission({ mode: "read" });
      if (permission === "granted") {
        return permission;
      }
    }

    if (typeof handle.requestPermission === "function") {
      return await handle.requestPermission({ mode: "read" });
    }
  } catch {
    return "denied";
  }

  return "denied";
}

function persistPosition() {
  if (!state.settings.rememberPosition || state.currentIndex < 0) {
    return;
  }

  const now = Date.now();
  if (now - state.lastPersistAt < 1000) {
    return;
  }
  state.lastPersistAt = now;

  const file = state.playlist[state.currentIndex];
  if (!file) {
    return;
  }

  state.positions[getFileFingerprint(file)] = el.video.currentTime;
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(state.positions));
}

function syncPlayButtonLabel() {
  if (el.playPauseBtn) {
    el.playPauseBtn.textContent = el.video.paused ? "Play" : "Pause";
  }
}

function onVideoPlay() {
  syncPlayButtonLabel();
  resumeAudioDelayContext();
}

function updateNowPlayingLabel(value) {
  if (!el.nowPlayingLabel) {
    return;
  }

  el.nowPlayingLabel.textContent = value || "No media loaded";
}

function adjustSubtitleOffset(delta) {
  const nextValue = clamp(
    Number(state.settings.subtitleOffset || 0) + delta,
    Number(el.subtitleOffsetInput?.min ?? -20),
    Number(el.subtitleOffsetInput?.max ?? 20)
  );

  state.settings.subtitleOffset = Number(nextValue.toFixed(2));
  if (el.subtitleOffsetInput) {
    el.subtitleOffsetInput.value = String(state.settings.subtitleOffset);
  }

  maybeUpdateCurrentTimingPreset();
  saveSettings();
  setStatus(`Subtitle offset: ${state.settings.subtitleOffset.toFixed(2)}s`);
}

function adjustAudioDelay(delta) {
  const nextValue = clamp(
    Number(state.settings.audioDelay || 0) + delta,
    -AUDIO_DELAY_MAX_SECONDS,
    AUDIO_DELAY_MAX_SECONDS
  );

  state.settings.audioDelay = Number(nextValue.toFixed(2));
  if (el.audioDelayInput) {
    el.audioDelayInput.value = String(state.settings.audioDelay);
  }

  maybeUpdateCurrentTimingPreset();
  saveSettings();
  applyAudioDelayProcessing();
  setStatus(`Audio delay: ${state.settings.audioDelay.toFixed(2)}s`);
}

function setVideoVolume(nextVolume) {
  el.video.volume = clamp(nextVolume, 0, 1);
  if (el.volumeInput) {
    el.volumeInput.value = String(el.video.volume);
  }
  persistVolumeSetting();
}

function adjustPlaybackSpeed(direction) {
  const speedOptions = Array.from(el.speedSelect?.options || [])
    .map((option) => Number(option.value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!speedOptions.length) {
    return;
  }

  const currentRate = Number(el.video.playbackRate || 1);
  const currentIndex = speedOptions.reduce((bestIndex, value, index) => {
    const bestDistance = Math.abs(speedOptions[bestIndex] - currentRate);
    const valueDistance = Math.abs(value - currentRate);
    return valueDistance < bestDistance ? index : bestIndex;
  }, 0);

  const nextIndex = clamp(currentIndex + direction, 0, speedOptions.length - 1);
  const nextRate = speedOptions[nextIndex];
  if (!Number.isFinite(nextRate)) {
    return;
  }

  el.video.playbackRate = nextRate;
  if (el.speedSelect) {
    el.speedSelect.value = String(nextRate);
  }

  persistSpeedSetting();
  setStatus(`Playback speed: ${nextRate.toFixed(2)}x`);
}

function nudgePlayback(delta) {
  const nextTime = Math.max(0, Number(el.video.currentTime || 0) + delta);
  el.video.currentTime = nextTime;
}

function syncPlyrCustomButtonState() {
  if (!state.plyrCustomButtons.loop) {
    return;
  }

  const isActive = Boolean(state.ab.loop);
  state.plyrCustomButtons.loop.classList.toggle("is-active", isActive);
}

function setStatus(message) {
  el.statusBanner.textContent = message;
  el.statusBanner.classList.remove("hidden");
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => {
    el.statusBanner.classList.add("hidden");
  }, 4000);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function releaseCurrentUrl() {
  teardownSeekThumbnailSource();

  if (state.currentObjectUrl) {
    URL.revokeObjectURL(state.currentObjectUrl);
    state.currentObjectUrl = null;
  }
}

function toggleFullscreen() {
  if (state.player?.fullscreen) {
    state.player.fullscreen.toggle();
    return;
  }

  const shell = document.getElementById("videoShell");
  if (!document.fullscreenElement) {
    shell.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function supportsFloatingMode() {
  return Boolean(document.pictureInPictureEnabled
    && el.video
    && typeof el.video.requestPictureInPicture === "function");
}

async function toggleFloatingMode() {
  if (!state.floatingMode.supported) {
    setStatus("Floating mode is not supported by this browser.");
    return;
  }

  try {
    if (document.pictureInPictureElement === el.video) {
      await document.exitPictureInPicture();
      return;
    }

    if (!el.video.src) {
      setStatus("Load media before using floating mode.");
      return;
    }

    await el.video.requestPictureInPicture();
  } catch {
    setStatus("Unable to toggle floating mode in this browser context.");
  }
}

function onEnterFloatingMode() {
  state.floatingMode.active = true;
  if (el.videoShell) {
    el.videoShell.classList.add("is-floating-active");
  }
  applyGpuEnhancementCompatibilityMode();
  syncFloatingModeUi();
  setStatus("Floating mode active.");
}

function onLeaveFloatingMode() {
  state.floatingMode.active = false;
  if (el.videoShell) {
    el.videoShell.classList.remove("is-floating-active");
  }
  applyGpuEnhancementCompatibilityMode();
  syncFloatingModeUi();
  setStatus("Returned from floating mode.");
}

function exitFloatingModeIfActive() {
  if (document.pictureInPictureElement !== el.video || typeof document.exitPictureInPicture !== "function") {
    return;
  }

  document.exitPictureInPicture().catch(() => {
    // Ignore failures when browser leaves PiP automatically.
  });
}

function syncFloatingModeUi() {
  const isSupported = Boolean(state.floatingMode.supported);
  const isActive = Boolean(state.floatingMode.active);

  if (el.floatingModeBtn) {
    el.floatingModeBtn.disabled = !isSupported;
    el.floatingModeBtn.classList.toggle("is-active", isActive);
    el.floatingModeBtn.classList.toggle("is-unsupported", !isSupported);

    const label = !isSupported
      ? "Floating unavailable"
      : isActive
        ? "Return from floating"
        : "Pop out";

    el.floatingModeBtn.title = !isSupported
      ? "Floating mode unavailable in this browser"
      : isActive
        ? "Return from floating mode"
        : "Pop out (Floating mode)";
    el.floatingModeBtn.setAttribute("aria-label", el.floatingModeBtn.title);

    const labelNode = el.floatingModeBtn.querySelector(".dock-btn-label");
    if (labelNode) {
      labelNode.textContent = label;
    }
  }

  const floatingButton = state.plyrCustomButtons.floating;
  if (floatingButton) {
    floatingButton.disabled = !isSupported;
    floatingButton.classList.toggle("is-active", isActive);
    floatingButton.classList.toggle("is-disabled", !isSupported);
    floatingButton.title = !isSupported
      ? "Floating mode unavailable"
      : isActive
        ? "Return from floating mode"
        : "Pop out (Floating mode)";
    floatingButton.setAttribute("aria-label", floatingButton.title);
  }
}

function initializePlyr() {
  if (state.plyrInitAttempts > 12) {
    return;
  }

  if (state.player) {
    return;
  }

  state.plyrInitAttempts += 1;

  if (!window.Plyr) {
    window.setTimeout(initializePlyr, 120);
    return;
  }

  try {
    state.player = new window.Plyr(el.video, {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "fullscreen"
      ],
      settings: ["speed"],
      speed: {
        selected: Number(state.settings.savedSpeed || 1),
        options: [0.5, 0.75, 1, 1.25, 1.5, 2]
      }
    });

    document.body.classList.add("has-plyr");
    state.player.on("ready", () => {
      ensureAudioCoverPlacement();
      injectPlyrCustomControls();
      syncPlyrCustomButtonState();
      setupProgressHoverPreview();
    });
    window.setTimeout(() => {
      ensureAudioCoverPlacement();
      injectPlyrCustomControls();
      syncPlyrCustomButtonState();
      setupProgressHoverPreview();
    }, 250);
  } catch {
    window.setTimeout(initializePlyr, 160);
  }
}

function injectPlyrCustomControls() {
  const controlsRoot = state.player?.elements?.controls || state.player?.elements?.container?.querySelector(".plyr__controls");
  if (!controlsRoot) {
    return;
  }

  if (controlsRoot.querySelector(".plyr__custom-group.is-nav")) {
    return;
  }

  const createGroup = (className) => {
    const group = document.createElement("div");
    group.className = `plyr__custom-group ${className}`;
    return group;
  };

  const addButton = (group, iconClass, title, onClick) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "plyr__control plyr__custom-btn icon-only";
    button.innerHTML = `<i class="plyr-icon ${iconClass}" aria-hidden="true"></i>`;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.addEventListener("click", onClick);
    group.appendChild(button);
    return button;
  };

  const navGroup = createGroup("is-nav");
  addButton(navGroup, "fa-solid fa-backward-step", "Previous file", playPrevious);
  addButton(navGroup, "fa-solid fa-stop", "Stop playback", stopPlayback);
  addButton(navGroup, "fa-solid fa-forward-step", "Next file", playNext);

  const viewGroup = createGroup("is-view");
  addButton(viewGroup, "fa-regular fa-object-group", "Cycle frame mode", cycleFrameMode);
  addButton(viewGroup, "fa-solid fa-up-right-and-down-left-from-center", "Cycle aspect ratio", cycleAspectRatio);
  addButton(viewGroup, "fa-solid fa-magnifying-glass-minus", "Zoom out", () => stepZoom(-1));
  addButton(viewGroup, "fa-solid fa-magnifying-glass-plus", "Zoom in", () => stepZoom(1));
  state.plyrCustomButtons.floating = addButton(viewGroup, "fa-solid fa-up-right-from-square", "Pop out (Floating mode)", toggleFloatingMode);

  const trackGroup = createGroup("is-track");
  addButton(trackGroup, "fa-solid fa-music", "Cycle audio track", cycleAudioTrack);
  addButton(trackGroup, "fa-solid fa-closed-captioning", "Cycle subtitle track", cycleSubtitleTrack);

  const timingGroup = createGroup("is-timing");
  state.plyrCustomButtons.setA = addButton(timingGroup, "fa-solid fa-left-long", "Set A marker", setA);
  state.plyrCustomButtons.setB = addButton(timingGroup, "fa-solid fa-right-long", "Set B marker", setB);
  state.plyrCustomButtons.loop = addButton(timingGroup, "fa-solid fa-repeat", "Toggle A-B loop", toggleABLoop);
  state.plyrCustomButtons.subMinus = addButton(timingGroup, "fa-solid fa-arrow-down", "Subtitle offset -0.1s", () => adjustSubtitleOffset(-0.1));
  state.plyrCustomButtons.subPlus = addButton(timingGroup, "fa-solid fa-arrow-up", "Subtitle offset +0.1s", () => adjustSubtitleOffset(0.1));
  state.plyrCustomButtons.prevSection = addButton(timingGroup, "fa-solid fa-backward-fast", "Go to previous section", goToPreviousSection);
  state.plyrCustomButtons.nextSection = addButton(timingGroup, "fa-solid fa-forward-fast", "Go to next section", goToNextSection);

  controlsRoot.insertBefore(timingGroup, controlsRoot.firstChild);
  controlsRoot.insertBefore(trackGroup, controlsRoot.firstChild);
  controlsRoot.insertBefore(viewGroup, controlsRoot.firstChild);
  controlsRoot.insertBefore(navGroup, controlsRoot.firstChild);

  renderSectionMarkers();
  syncSectionNavigationState();
  setupProgressHoverPreview();
  syncFloatingModeUi();
}

function setupProgressHoverPreview() {
  const progressContainer = state.player?.elements?.controls?.querySelector(".plyr__progress__container");
  if (!progressContainer || progressContainer.dataset.previewBound === "true") {
    return;
  }

  const playerContainer = state.player?.elements?.container
    || progressContainer.closest(".plyr")
    || null;
  const controlsRoot = state.player?.elements?.controls
    || playerContainer?.querySelector(".plyr__controls")
    || progressContainer.closest(".plyr__controls")
    || null;

  const hoverTarget = progressContainer.querySelector(".plyr__progress input[type='range'].plyr__seek")
    || progressContainer.querySelector("input[type='range'].plyr__seek")
    || progressContainer.querySelector("input[type='range'][data-plyr='seek']");

  // Only bind preview behavior when we can target the actual seekbar input.
  // This prevents hover-preview from staying visible while hovering sibling controls.
  if (!hoverTarget) {
    return;
  }

  progressContainer.dataset.previewBound = "true";

  const preview = document.createElement("div");
  preview.className = "plyr__hover-preview hidden";

  const previewThumb = document.createElement("img");
  previewThumb.className = "plyr__hover-preview-thumb hidden";
  previewThumb.alt = "Seek preview thumbnail";
  preview.appendChild(previewThumb);

  const previewText = document.createElement("span");
  previewText.className = "plyr__hover-preview-text";
  preview.appendChild(previewText);

  state.hoverPreviewThumbEl = previewThumb;

  progressContainer.appendChild(preview);

  const isWithinHoverTarget = (clientX, clientY) => {
    const rect = hoverTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return false;
    }

    return clientX >= rect.left
      && clientX <= rect.right
      && clientY >= rect.top
      && clientY <= rect.bottom;
  };

  const hidePreview = () => {
    preview.classList.add("hidden");
    previewThumb.classList.add("hidden");
  };

  const showPreviewAt = (clientX, clientY) => {
    const rect = hoverTarget.getBoundingClientRect();
    if (!rect.width) {
      hidePreview();
      return;
    }

    if (Number.isFinite(clientY) && !isWithinHoverTarget(clientX, clientY)) {
      hidePreview();
      return;
    }

    const duration = Number.isFinite(el.video.duration) && el.video.duration > 0
      ? Number(el.video.duration)
      : inferDurationFromSections(state.sections);

    if (!Number.isFinite(duration) || duration <= 0) {
      hidePreview();
      return;
    }

    const relativeX = clamp(clientX - rect.left, 0, rect.width);
    const ratio = relativeX / rect.width;
    const hoverTime = ratio * duration;
    const section = getSectionForTime(hoverTime);
    previewText.textContent = section ? `${formatTime(hoverTime)} - ${section.title}` : formatTime(hoverTime);

    const currentFile = state.playlist[state.currentIndex];
    if (currentFile && isAudioLikeFile(currentFile)) {
      const audioCoverSrc = el.audioCoverThumb?.getAttribute("src");
      if (audioCoverSrc) {
        previewThumb.src = audioCoverSrc;
        previewThumb.classList.remove("hidden");
      } else {
        previewThumb.classList.add("hidden");
      }
    } else {
      requestSeekThumbnailFrame(hoverTime, previewThumb);
    }

    preview.style.left = `${ratio * 100}%`;
    preview.classList.remove("hidden");
  };

  const hideWhenPointerLeavesSeekbar = (event) => {
    if (preview.classList.contains("hidden")) {
      return;
    }

    if (!isWithinHoverTarget(event.clientX, event.clientY)) {
      hidePreview();
    }
  };

  const hideWhenControlsNotHoveringSeekbar = (event) => {
    if (preview.classList.contains("hidden")) {
      return;
    }

    if (!isWithinHoverTarget(event.clientX, event.clientY)) {
      hidePreview();
    }
  };

  hoverTarget.addEventListener("mousemove", (event) => showPreviewAt(event.clientX, event.clientY));
  hoverTarget.addEventListener("pointermove", (event) => showPreviewAt(event.clientX, event.clientY));
  hoverTarget.addEventListener("mouseenter", (event) => showPreviewAt(event.clientX, event.clientY));
  hoverTarget.addEventListener("pointerenter", (event) => showPreviewAt(event.clientX, event.clientY));
  hoverTarget.addEventListener("mouseleave", hidePreview);
  hoverTarget.addEventListener("pointerleave", hidePreview);
  progressContainer.addEventListener("mouseleave", hidePreview);
  progressContainer.addEventListener("pointerleave", hidePreview);
  controlsRoot?.addEventListener("mousemove", hideWhenControlsNotHoveringSeekbar);
  controlsRoot?.addEventListener("pointermove", hideWhenControlsNotHoveringSeekbar);
  window.addEventListener("mousemove", hideWhenPointerLeavesSeekbar, true);
  window.addEventListener("pointermove", hideWhenPointerLeavesSeekbar, true);
  window.addEventListener("pointerdown", hidePreview, true);
  window.addEventListener("scroll", hidePreview, true);
  window.addEventListener("blur", hidePreview);
  window.addEventListener("resize", hidePreview);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hidePreview();
    }
  });

  if (playerContainer) {
    const controlsVisibilityObserver = new MutationObserver(() => {
      if (playerContainer.classList.contains("plyr--hide-controls")) {
        hidePreview();
      }
    });

    controlsVisibilityObserver.observe(playerContainer, {
      attributes: true,
      attributeFilter: ["class"]
    });

    window.addEventListener("beforeunload", () => {
      controlsVisibilityObserver.disconnect();
    }, { once: true });
  }
}

function ensureAudioCoverPlacement() {
  if (!el.audioCoverThumb) {
    return;
  }

  const plyrVideoWrapper = state.player?.elements?.container?.querySelector(".plyr__video-wrapper");
  if (plyrVideoWrapper) {
    if (el.audioCoverThumb.parentElement !== plyrVideoWrapper) {
      plyrVideoWrapper.appendChild(el.audioCoverThumb);
    }
    return;
  }

  if (el.videoShell && el.audioCoverThumb.parentElement !== el.videoShell) {
    el.videoShell.appendChild(el.audioCoverThumb);
  }
}

function getSectionForTime(timeSeconds) {
  if (!Array.isArray(state.sections) || !state.sections.length) {
    return null;
  }

  let match = null;
  for (let i = 0; i < state.sections.length; i += 1) {
    const section = state.sections[i];
    if (timeSeconds >= section.start - SECTION_SYNC_EPSILON) {
      match = section;
      continue;
    }
    break;
  }

  return match;
}

function prepareSeekThumbnailSource(file) {
  teardownSeekThumbnailSource();

  if (!file || isAudioLikeFile(file) || !state.currentObjectUrl || shouldUseGpuEnhancementCompatibilityPath()) {
    return;
  }

  const previewVideo = document.createElement("video");
  previewVideo.preload = "auto";
  previewVideo.muted = true;
  previewVideo.defaultMuted = true;
  previewVideo.playsInline = true;
  previewVideo.crossOrigin = "anonymous";
  previewVideo.src = state.currentObjectUrl;
  previewVideo.style.position = "fixed";
  previewVideo.style.left = "-99999px";
  previewVideo.style.top = "-99999px";
  previewVideo.style.width = "1px";
  previewVideo.style.height = "1px";
  previewVideo.style.opacity = "0";
  previewVideo.setAttribute("aria-hidden", "true");

  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = SEEK_PREVIEW_THUMB_WIDTH;
  previewCanvas.height = SEEK_PREVIEW_THUMB_HEIGHT;
  const previewContext = previewCanvas.getContext("2d");

  if (!previewContext) {
    return;
  }

  state.hoverPreviewVideo = previewVideo;
  state.hoverPreviewCanvas = previewCanvas;
  state.hoverPreviewContext = previewContext;
  state.hoverPreviewReady = false;
  state.hoverPreviewFailed = false;
  state.hoverPreviewBusy = false;
  state.hoverPreviewPendingTime = Number.NaN;
  state.hoverPreviewLastTime = Number.NaN;

  const markReady = () => {
    state.hoverPreviewReady = true;
  };

  previewVideo.addEventListener("loadeddata", markReady, { once: true });
  previewVideo.addEventListener("canplay", markReady, { once: true });
  previewVideo.addEventListener("error", () => {
    state.hoverPreviewFailed = true;
  }, { once: true });

  document.body.appendChild(previewVideo);
  previewVideo.load();
}

function teardownSeekThumbnailSource() {
  if (state.hoverPreviewVideo) {
    state.hoverPreviewVideo.pause();
    state.hoverPreviewVideo.removeAttribute("src");
    state.hoverPreviewVideo.load();
    state.hoverPreviewVideo.remove();
  }

  state.hoverPreviewVideo = null;
  state.hoverPreviewCanvas = null;
  state.hoverPreviewContext = null;
  state.hoverPreviewReady = false;
  state.hoverPreviewFailed = false;
  state.hoverPreviewBusy = false;
  state.hoverPreviewPendingTime = Number.NaN;
  state.hoverPreviewLastTime = Number.NaN;
}

function requestSeekThumbnailFrame(timeSeconds, previewThumb) {
  if (!previewThumb) {
    return;
  }

  if (!state.hoverPreviewVideo || state.hoverPreviewFailed) {
    previewThumb.classList.add("hidden");
    return;
  }

  const safeTime = Number(timeSeconds);
  if (!Number.isFinite(safeTime)) {
    previewThumb.classList.add("hidden");
    return;
  }

  if (Number.isFinite(state.hoverPreviewLastTime)
    && Math.abs(state.hoverPreviewLastTime - safeTime) < 0.2
    && previewThumb.getAttribute("src")) {
    previewThumb.classList.remove("hidden");
    return;
  }

  state.hoverPreviewPendingTime = safeTime;
  if (state.hoverPreviewBusy) {
    return;
  }

  state.hoverPreviewBusy = true;
  void drainSeekThumbnailRequests(previewThumb);
}

async function drainSeekThumbnailRequests(previewThumb) {
  while (Number.isFinite(state.hoverPreviewPendingTime)) {
    const pendingTime = state.hoverPreviewPendingTime;
    state.hoverPreviewPendingTime = Number.NaN;

    const rendered = await captureSeekThumbnailAt(pendingTime, previewThumb);
    if (!rendered) {
      previewThumb.classList.add("hidden");
    }
  }

  state.hoverPreviewBusy = false;
}

async function captureSeekThumbnailAt(timeSeconds, previewThumb) {
  const previewVideo = state.hoverPreviewVideo;
  const previewCanvas = state.hoverPreviewCanvas;
  const previewContext = state.hoverPreviewContext;

  if (!previewVideo || !previewCanvas || !previewContext || state.hoverPreviewFailed) {
    return false;
  }

  const duration = Number.isFinite(previewVideo.duration) && previewVideo.duration > 0
    ? Number(previewVideo.duration)
    : (Number.isFinite(el.video.duration) && el.video.duration > 0
      ? Number(el.video.duration)
      : inferDurationFromSections(state.sections));

  if (!Number.isFinite(duration) || duration <= 0) {
    return false;
  }

  if (!state.hoverPreviewReady && previewVideo.readyState < 2) {
    return false;
  }

  state.hoverPreviewReady = true;

  const targetTime = clamp(Number(timeSeconds), 0, Math.max(duration - 0.05, 0));
  const seeked = await seekPreviewVideoToTime(previewVideo, targetTime);
  if (!seeked || !previewVideo.videoWidth || !previewVideo.videoHeight) {
    return false;
  }

  if (previewCanvas.width !== SEEK_PREVIEW_THUMB_WIDTH || previewCanvas.height !== SEEK_PREVIEW_THUMB_HEIGHT) {
    previewCanvas.width = SEEK_PREVIEW_THUMB_WIDTH;
    previewCanvas.height = SEEK_PREVIEW_THUMB_HEIGHT;
  }

  const drawWidthRatio = SEEK_PREVIEW_THUMB_WIDTH / previewVideo.videoWidth;
  const drawHeightRatio = SEEK_PREVIEW_THUMB_HEIGHT / previewVideo.videoHeight;
  const scale = Math.min(drawWidthRatio, drawHeightRatio);
  const drawWidth = Math.max(1, Math.round(previewVideo.videoWidth * scale));
  const drawHeight = Math.max(1, Math.round(previewVideo.videoHeight * scale));
  const drawX = Math.floor((SEEK_PREVIEW_THUMB_WIDTH - drawWidth) / 2);
  const drawY = Math.floor((SEEK_PREVIEW_THUMB_HEIGHT - drawHeight) / 2);

  try {
    previewContext.fillStyle = "#000";
    previewContext.fillRect(0, 0, SEEK_PREVIEW_THUMB_WIDTH, SEEK_PREVIEW_THUMB_HEIGHT);
    previewContext.drawImage(previewVideo, drawX, drawY, drawWidth, drawHeight);
    previewThumb.src = previewCanvas.toDataURL("image/jpeg", 0.75);
    previewThumb.classList.remove("hidden");
    state.hoverPreviewLastTime = targetTime;
    return true;
  } catch {
    state.hoverPreviewFailed = true;
    return false;
  }
}

async function seekPreviewVideoToTime(video, targetTime) {
  if (!video || !Number.isFinite(targetTime)) {
    return false;
  }

  if (Math.abs(Number(video.currentTime || 0) - targetTime) <= 0.06) {
    return true;
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = 0;

    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(value);
    };

    const onSeeked = () => finish(true);
    const onError = () => finish(false);

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    timeoutId = window.setTimeout(() => finish(false), SEEK_PREVIEW_SEEK_TIMEOUT_MS);

    try {
      video.currentTime = targetTime;
    } catch {
      finish(false);
    }
  });
}

function cycleAudioTrack() {
  const audioTracks = el.video.audioTracks;
  if (!audioTracks || audioTracks.length === 0) {
    setStatus("No selectable audio tracks exposed by this browser for the current file.");
    return;
  }

  let current = 0;
  for (let i = 0; i < audioTracks.length; i += 1) {
    if (audioTracks[i].enabled) {
      current = i;
      break;
    }
  }

  const next = (current + 1) % audioTracks.length;
  for (let i = 0; i < audioTracks.length; i += 1) {
    audioTracks[i].enabled = i === next;
  }

  el.audioTrackSelect.value = String(next);
  const track = audioTracks[next];
  const trackLabel = track.label || track.language || `Track ${next + 1}`;
  setStatus(`Audio track: ${trackLabel}`);
}

function cycleSubtitleTrack() {
  const options = Array.from(el.subtitleTrackSelect.options || []);
  if (!options.length) {
    return;
  }

  const current = options.findIndex((option) => option.value === el.subtitleTrackSelect.value);
  const next = (Math.max(0, current) + 1) % options.length;

  el.subtitleTrackSelect.value = options[next].value;
  onSubtitleTrackChanged();
  setStatus(`Subtitle: ${options[next].textContent}`);
}

function persistVolumeSetting() {
  if (state.settings.rememberVolume) {
    state.settings.savedVolume = el.video.volume;
    saveSettings();
  }
}

function persistSpeedSetting() {
  if (state.settings.rememberSpeed) {
    state.settings.savedSpeed = el.video.playbackRate;
    saveSettings();
  }
}

function resumeAudioDelayContext() {
  const context = state.audioDelayEngine.context;
  if (!context || context.state !== "suspended") {
    return;
  }

  context.resume().catch(() => {
    // Some platforms require a later user gesture before resume succeeds.
  });
}

function ensureAudioDelayEngine() {
  if (state.audioDelayEngine.unavailable) {
    return false;
  }

  if (state.audioDelayEngine.context && state.audioDelayEngine.sourceNode && state.audioDelayEngine.delayNode) {
    return true;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    state.audioDelayEngine.unavailable = true;
    return false;
  }

  try {
    const context = state.audioDelayEngine.context || new AudioContextCtor();
    const sourceNode = context.createMediaElementSource(el.video);
    const delayNode = context.createDelay(AUDIO_DELAY_MAX_SECONDS + 0.1);

    sourceNode.connect(delayNode);
    delayNode.connect(context.destination);

    state.audioDelayEngine.context = context;
    state.audioDelayEngine.sourceNode = sourceNode;
    state.audioDelayEngine.delayNode = delayNode;
    return true;
  } catch {
    state.audioDelayEngine.unavailable = true;
    return false;
  }
}

function applyAudioDelayProcessing() {
  state.settings.audioDelay = clamp(Number(state.settings.audioDelay || 0), -AUDIO_DELAY_MAX_SECONDS, AUDIO_DELAY_MAX_SECONDS);
  if (el.audioDelayInput) {
    el.audioDelayInput.value = String(state.settings.audioDelay);
  }

  const requestedDelay = Number(state.settings.audioDelay || 0);
  const effectiveDelay = Math.max(0, requestedDelay);

  if (effectiveDelay > 0) {
    const hasAudioDelayEngine = ensureAudioDelayEngine();
    if (hasAudioDelayEngine) {
      state.audioDelayEngine.delayNode.delayTime.setValueAtTime(effectiveDelay, state.audioDelayEngine.context.currentTime);
      resumeAudioDelayContext();
    }
  } else if (state.audioDelayEngine.delayNode && state.audioDelayEngine.context) {
    state.audioDelayEngine.delayNode.delayTime.setValueAtTime(0, state.audioDelayEngine.context.currentTime);
  }

  if (!el.audioDelayNote) {
    return;
  }

  if (requestedDelay < 0) {
    el.audioDelayNote.textContent = `Negative audio delay (${requestedDelay.toFixed(2)}s) cannot be rendered directly in-browser. Use Playback Offset for early-audio compensation.`;
    return;
  }

  if (state.audioDelayEngine.unavailable) {
    el.audioDelayNote.textContent = "Audio delay processing is unavailable in this browser. Value is still saved in settings.";
    return;
  }

  if (requestedDelay > 0) {
    el.audioDelayNote.textContent = `Audio stream delay active: +${requestedDelay.toFixed(2)}s.`;
    return;
  }

  el.audioDelayNote.textContent = "Audio delay stream processing is ready. Set a positive value to delay audio output.";
}

function applyPlaybackPreferences() {
  state.settings.shortcuts = normalizeShortcutBindings(state.settings.shortcuts);
  state.settings.preferGpuEnhancementNormalMode = state.settings.preferGpuEnhancementNormalMode !== false;
  state.settings.shortcutSectionNavigation = Boolean(state.settings.shortcutSectionNavigation);
  state.settings.enforceFrameConstraints = state.settings.enforceFrameConstraints !== false;

  if (state.settings.rememberVolume) {
    el.video.volume = clamp(Number(state.settings.savedVolume || 1), 0, 1);
    el.volumeInput.value = String(el.video.volume);
  }

  if (state.settings.rememberSpeed) {
    const speed = Number(state.settings.savedSpeed || 1);
    el.video.playbackRate = speed;
    el.speedSelect.value = String(speed);
  }

  el.subtitleOffsetInput.value = String(Number(state.settings.subtitleOffset || 0));
  state.settings.audioDelay = clamp(Number(state.settings.audioDelay || 0), -AUDIO_DELAY_MAX_SECONDS, AUDIO_DELAY_MAX_SECONDS);
  el.audioDelayInput.value = String(state.settings.audioDelay);
  el.usePerVideoTiming.checked = Boolean(state.settings.usePerVideoTiming);
  state.settings.frameMode = normalizeFrameModeValue(state.settings.frameMode || defaults.frameMode);
  state.frameShortcutMode.lastPresetMode = state.settings.frameMode;
  state.frameShortcutMode.active = false;
  state.settings.aspectRatio = normalizeAspectRatioSelection(state.settings.aspectRatio || defaults.aspectRatio);
  state.settings.zoomPercent = clamp(Number(state.settings.zoomPercent || defaults.zoomPercent), 50, 300);
  normalizeFrameTransformSettings();
  state.settings.playlistShuffle = Boolean(state.settings.playlistShuffle);
  if (!["off", "all", "one"].includes(state.settings.playlistRepeatMode)) {
    state.settings.playlistRepeatMode = "off";
  }

  applyAudioDelayProcessing();
  updatePlaylistModeButtons();
  applyGpuEnhancementCompatibilityMode();
}

function normalizeShortcutBindings(rawBindings) {
  const normalized = { ...DEFAULT_SHORTCUT_BINDINGS };
  if (!rawBindings || typeof rawBindings !== "object") {
    return normalized;
  }

  SHORTCUT_DEFINITIONS.forEach((definition) => {
    const normalizedBinding = normalizeShortcutBinding(rawBindings[definition.id]);
    if (normalizedBinding != null) {
      normalized[definition.id] = normalizedBinding;
    }
  });

  return normalized;
}

function normalizeShortcutBinding(binding) {
  if (typeof binding !== "string") {
    return null;
  }

  const trimmed = binding.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed === "+") {
    return "Plus";
  }

  const parts = trimmed.split("+").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) {
    return "";
  }

  const modifiers = new Set();
  let keyToken = "";

  parts.forEach((part) => {
    const lower = part.toLowerCase();
    if (lower === "ctrl" || lower === "control" || lower === "cmdorctrl") {
      modifiers.add("Ctrl");
      return;
    }
    if (lower === "alt" || lower === "option") {
      modifiers.add("Alt");
      return;
    }
    if (lower === "shift") {
      modifiers.add("Shift");
      return;
    }

    keyToken = normalizeShortcutKeyToken(part);
  });

  if (!keyToken) {
    return "";
  }

  const orderedModifiers = ["Ctrl", "Alt", "Shift"].filter((modifier) => modifiers.has(modifier));
  return [...orderedModifiers, keyToken].join("+");
}

function normalizeShortcutKeyToken(token) {
  const value = String(token || "").trim();
  if (!value) {
    return "";
  }

  const mapped = eventKeyToShortcutToken(value);
  return mapped || "";
}

function eventKeyToShortcutToken(rawKey) {
  const key = String(rawKey || "");
  if (!key) {
    return "";
  }

  const lower = key.toLowerCase();
  if (lower === "shift" || lower === "control" || lower === "ctrl" || lower === "alt" || lower === "meta" || lower === "os") {
    return "";
  }

  const specialKeys = {
    " ": "Space",
    spacebar: "Space",
    esc: "Escape",
    return: "Enter",
    del: "Delete",
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
    plus: "Plus"
  };

  if (Object.prototype.hasOwnProperty.call(specialKeys, lower)) {
    return specialKeys[lower];
  }

  if (key === "+") {
    return "Plus";
  }

  if (key.length === 1) {
    return /[a-z]/i.test(key) ? key.toUpperCase() : key;
  }

  return key;
}

function getShortcutComboFromEvent(event) {
  const keyToken = getShortcutTokenFromKeyboardEvent(event);
  if (!keyToken) {
    return "";
  }

  const modifiers = [];
  if (event.ctrlKey || event.metaKey) {
    modifiers.push("Ctrl");
  }
  if (event.altKey) {
    modifiers.push("Alt");
  }
  if (event.shiftKey) {
    modifiers.push("Shift");
  }

  return [...modifiers, keyToken].join("+");
}

function getShortcutTokenFromKeyboardEvent(event) {
  const code = String(event.code || "");
  if (code.startsWith("Numpad")) {
    return code;
  }

  return eventKeyToShortcutToken(event.key);
}

function getShortcutDefinition(actionId) {
  return SHORTCUT_DEFINITIONS.find((definition) => definition.id === actionId) || null;
}

function getShortcutGroupId(actionId) {
  if (actionId.startsWith("frameMove") || actionId === "framePositionReset") {
    return "frame-move";
  }

  if (actionId.startsWith("frame") || actionId === "frameSizeReset") {
    return "frame-resize";
  }

  if (actionId === "nextFile" || actionId === "previousFile" || actionId === "nextSection" || actionId === "previousSection") {
    return "navigation";
  }

  if (actionId === "audioDelayUp" || actionId === "audioDelayDown"
    || actionId === "subtitleDelayUp" || actionId === "subtitleDelayDown"
    || actionId === "abLoopToggle") {
    return "timing";
  }

  return "playback";
}

function formatShortcutBindingLabel(binding) {
  if (!binding) {
    return "Unassigned";
  }

  return binding
    .replace(/Plus/g, "+")
    .replace(/Numpad/g, "NumPad");
}

function findShortcutActionByBinding(binding) {
  if (!binding) {
    return "";
  }

  state.settings.shortcuts = normalizeShortcutBindings(state.settings.shortcuts);

  const match = SHORTCUT_DEFINITIONS.find((definition) => state.settings.shortcuts[definition.id] === binding);
  return match ? match.id : "";
}

function renderShortcutBindingsEditor() {
  if (!el.shortcutBindings) {
    return;
  }

  state.settings.shortcuts = normalizeShortcutBindings(state.settings.shortcuts);

  el.shortcutBindings.innerHTML = "";

  const definitionsByGroup = SHORTCUT_DEFINITIONS.reduce((groups, definition) => {
    const groupId = getShortcutGroupId(definition.id);
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push(definition);
    return groups;
  }, {});

  SHORTCUT_GROUP_ORDER.forEach((groupId) => {
    const definitions = definitionsByGroup[groupId] || [];
    if (!definitions.length) {
      return;
    }

    const groupBlock = document.createElement("section");
    groupBlock.className = "shortcut-group";

    const heading = document.createElement("h4");
    heading.className = "shortcut-group-title";
    heading.textContent = SHORTCUT_GROUP_LABELS[groupId] || groupId;
    groupBlock.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "shortcut-group-grid";

    definitions.forEach((definition) => {
      const row = document.createElement("div");
      row.className = "shortcut-row";

      const label = document.createElement("span");
      label.className = "shortcut-name";
      label.textContent = definition.label;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn secondary shortcut-binding-btn";
      button.dataset.shortcutAction = definition.id;

      const isCapturing = state.shortcutCapture.actionId === definition.id;
      button.textContent = isCapturing
        ? "Press shortcut..."
        : formatShortcutBindingLabel(state.settings.shortcuts[definition.id]);

      if (isCapturing) {
        row.classList.add("is-capturing");
        button.classList.add("is-capturing");
      }

      row.appendChild(label);
      row.appendChild(button);
      grid.appendChild(row);
    });

    groupBlock.appendChild(grid);
    el.shortcutBindings.appendChild(groupBlock);
  });
}

function onShortcutBindingsClick(event) {
  const button = event.target?.closest?.("button[data-shortcut-action]");
  if (!button) {
    return;
  }

  const actionId = button.dataset.shortcutAction || "";
  if (!actionId) {
    return;
  }

  if (state.shortcutCapture.actionId === actionId) {
    stopShortcutCapture();
    return;
  }

  startShortcutCapture(actionId, button);
}

function startShortcutCapture(actionId, button) {
  stopShortcutCapture();

  state.shortcutCapture.actionId = actionId;
  state.shortcutCapture.button = button || null;
  renderShortcutBindingsEditor();

  const definition = getShortcutDefinition(actionId);
  setStatus(`Press a key combo for ${definition?.label || "this action"}. Press Escape to clear.`);
}

function stopShortcutCapture() {
  if (!state.shortcutCapture.actionId) {
    return;
  }

  state.shortcutCapture.actionId = "";
  state.shortcutCapture.button = null;
  renderShortcutBindingsEditor();
}

function assignShortcutBinding(actionId, binding) {
  state.settings.shortcuts = normalizeShortcutBindings(state.settings.shortcuts);
  const normalizedBinding = normalizeShortcutBinding(binding);
  if (normalizedBinding == null) {
    return;
  }

  if (normalizedBinding) {
    SHORTCUT_DEFINITIONS.forEach((definition) => {
      if (definition.id !== actionId && state.settings.shortcuts[definition.id] === normalizedBinding) {
        state.settings.shortcuts[definition.id] = "";
      }
    });
  }

  state.settings.shortcuts[actionId] = normalizedBinding;
}

function resetShortcutBindings() {
  stopShortcutCapture();
  state.settings.shortcuts = { ...DEFAULT_SHORTCUT_BINDINGS };
  saveSettings();
  renderShortcutBindingsEditor();
  setStatus("Keyboard shortcuts reset to defaults.");
}

function handleShortcutCaptureKeydown(event) {
  const actionId = state.shortcutCapture.actionId;
  if (!actionId) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape" || event.key === "Backspace" || event.key === "Delete") {
    assignShortcutBinding(actionId, "");
    saveSettings();
    stopShortcutCapture();
    const definition = getShortcutDefinition(actionId);
    setStatus(`${definition?.label || "Shortcut"} cleared.`);
    return true;
  }

  const binding = getShortcutComboFromEvent(event);
  if (!binding) {
    return true;
  }

  assignShortcutBinding(actionId, binding);
  saveSettings();
  stopShortcutCapture();

  const definition = getShortcutDefinition(actionId);
  setStatus(`${definition?.label || "Shortcut"}: ${formatShortcutBindingLabel(binding)}`);
  return true;
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const targetTag = target.tagName.toLowerCase();
  return targetTag === "input"
    || targetTag === "select"
    || targetTag === "textarea"
    || target.isContentEditable;
}

function runShortcutAction(actionId) {
  const step = Number(state.settings.seekStep || 5);

  switch (actionId) {
    case "playPause":
      togglePlayPause();
      return true;
    case "seekForward":
      el.video.currentTime += step;
      return true;
    case "seekBackward":
      el.video.currentTime = Math.max(0, el.video.currentTime - step);
      return true;
    case "volumeUp":
      setVideoVolume(el.video.volume + 0.05);
      return true;
    case "volumeDown":
      setVideoVolume(el.video.volume - 0.05);
      return true;
    case "speedUp":
      adjustPlaybackSpeed(1);
      return true;
    case "speedDown":
      adjustPlaybackSpeed(-1);
      return true;
    case "audioDelayUp":
      adjustAudioDelay(0.05);
      return true;
    case "audioDelayDown":
      adjustAudioDelay(-0.05);
      return true;
    case "subtitleDelayUp":
      adjustSubtitleOffset(0.1);
      return true;
    case "subtitleDelayDown":
      adjustSubtitleOffset(-0.1);
      return true;
    case "muteToggle":
      el.video.muted = !el.video.muted;
      return true;
    case "fullscreenToggle":
      toggleFullscreen();
      return true;
    case "nextFile":
      if (state.settings.shortcutSectionNavigation && jumpToAdjacentSection(1, { announce: true })) {
        return true;
      }
      playNext();
      return true;
    case "previousFile":
      if (state.settings.shortcutSectionNavigation && jumpToAdjacentSection(-1, { announce: true })) {
        return true;
      }
      playPrevious();
      return true;
    case "nextSection":
      goToNextSection();
      return true;
    case "previousSection":
      goToPreviousSection();
      return true;
    case "frameWidthIncrease":
      adjustFrameScale(FRAME_RESIZE_STEP, 0);
      return true;
    case "frameWidthDecrease":
      adjustFrameScale(-FRAME_RESIZE_STEP, 0);
      return true;
    case "frameHeightIncrease":
      adjustFrameScale(0, FRAME_RESIZE_STEP);
      return true;
    case "frameHeightDecrease":
      adjustFrameScale(0, -FRAME_RESIZE_STEP);
      return true;
    case "frameScaleDiagonalIncrease":
      adjustFrameScale(FRAME_RESIZE_STEP, FRAME_RESIZE_STEP);
      return true;
    case "frameScaleDiagonalDecrease":
      adjustFrameScale(-FRAME_RESIZE_STEP, -FRAME_RESIZE_STEP);
      return true;
    case "frameSizeReset":
      resetFrameScale();
      return true;
    case "frameMoveLeft":
      adjustFrameOffset(-getFrameMoveStepPx(), 0);
      return true;
    case "frameMoveRight":
      adjustFrameOffset(getFrameMoveStepPx(), 0);
      return true;
    case "frameMoveUp":
      adjustFrameOffset(0, -getFrameMoveStepPx());
      return true;
    case "frameMoveDown":
      adjustFrameOffset(0, getFrameMoveStepPx());
      return true;
    case "frameMoveUpRight":
      adjustFrameOffset(getFrameMoveStepPx(), -getFrameMoveStepPx());
      return true;
    case "frameMoveDownLeft":
      adjustFrameOffset(-getFrameMoveStepPx(), getFrameMoveStepPx());
      return true;
    case "frameMoveUpLeft":
      adjustFrameOffset(-getFrameMoveStepPx(), -getFrameMoveStepPx());
      return true;
    case "frameMoveDownRight":
      adjustFrameOffset(getFrameMoveStepPx(), getFrameMoveStepPx());
      return true;
    case "framePositionReset":
      resetFrameOffset();
      return true;
    case "abLoopToggle":
      toggleABLoop();
      return true;
    default:
      return false;
  }
}

function syncSettingsUI() {
  state.settings.shortcuts = normalizeShortcutBindings(state.settings.shortcuts);

  el.rememberLastFile.checked = Boolean(state.settings.rememberLastFile);
  el.rememberPosition.checked = Boolean(state.settings.rememberPosition);
  el.autoplayNext.checked = Boolean(state.settings.autoplayNext);
  el.enableShortcuts.checked = Boolean(state.settings.enableShortcuts);
  if (el.preferGpuEnhancementNormalMode) {
    el.preferGpuEnhancementNormalMode.checked = state.settings.preferGpuEnhancementNormalMode !== false;
  }
  if (el.shortcutSectionNavigation) {
    el.shortcutSectionNavigation.checked = Boolean(state.settings.shortcutSectionNavigation);
  }
  if (el.enforceFrameConstraints) {
    el.enforceFrameConstraints.checked = state.settings.enforceFrameConstraints !== false;
  }
  el.rememberVolume.checked = Boolean(state.settings.rememberVolume);
  el.rememberSpeed.checked = Boolean(state.settings.rememberSpeed);
  el.showSubtitlesByDefault.checked = Boolean(state.settings.showSubtitlesByDefault);
  el.themeSelect.value = state.settings.theme;
  el.seekStep.value = String(state.settings.seekStep);

  renderShortcutBindingsEditor();
}

function saveSettingsFromUI() {
  stopShortcutCapture();

  state.settings.rememberLastFile = el.rememberLastFile.checked;
  state.settings.rememberPosition = el.rememberPosition.checked;
  state.settings.autoplayNext = el.autoplayNext.checked;
  state.settings.enableShortcuts = el.enableShortcuts.checked;
  state.settings.preferGpuEnhancementNormalMode = el.preferGpuEnhancementNormalMode
    ? el.preferGpuEnhancementNormalMode.checked
    : true;
  state.settings.shortcutSectionNavigation = Boolean(el.shortcutSectionNavigation?.checked);
  state.settings.enforceFrameConstraints = el.enforceFrameConstraints
    ? el.enforceFrameConstraints.checked
    : true;
  state.settings.rememberVolume = el.rememberVolume.checked;
  state.settings.rememberSpeed = el.rememberSpeed.checked;
  state.settings.showSubtitlesByDefault = el.showSubtitlesByDefault.checked;
  state.settings.theme = el.themeSelect.value;
  state.settings.seekStep = clamp(Number(el.seekStep.value), 1, 60);
  if (el.frameModeSelect) {
    const selectedFrameMode = el.frameModeSelect.value;
    state.settings.frameMode = selectedFrameMode === "custom"
      ? normalizeFrameModeValue(state.frameShortcutMode.lastPresetMode || state.settings.frameMode)
      : normalizeFrameModeValue(selectedFrameMode);
  }
  if (el.aspectRatioSelect) {
    state.settings.aspectRatio = normalizeAspectRatioSelection(el.aspectRatioSelect.value);
  }
  if (el.zoomSelect) {
    state.settings.zoomPercent = clamp(Number(el.zoomSelect.value), 50, 300);
  }

  normalizeFrameTransformSettings();
  state.settings.shortcuts = normalizeShortcutBindings(state.settings.shortcuts);
  saveSettings();
  applyTheme(state.settings.theme);
  applyAudioDelayProcessing();
  applySubtitleStyle();
  applyVideoPresentation();
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function resetSettings() {
  stopShortcutCapture();

  state.settings = {
    ...defaults,
    shortcuts: { ...DEFAULT_SHORTCUT_BINDINGS }
  };
  saveSettings();
  syncSettingsUI();
  applyTheme(state.settings.theme);
  applyPlaybackPreferences();
  applySubtitleStyle();
  applyVideoPresentation();
  setStatus("Settings reset to defaults.");
}

function exportSettings() {
  const blob = new Blob([JSON.stringify(state.settings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "local-video-player-settings.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importSettings(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  file.text().then((text) => {
    const data = JSON.parse(text);
    state.settings = {
      ...defaults,
      ...data,
      shortcuts: normalizeShortcutBindings(data?.shortcuts)
    };
    saveSettings();
    syncSettingsUI();
    applyTheme(state.settings.theme);
    applyPlaybackPreferences();
    applySubtitleStyle();
    applyVideoPresentation();
    setStatus("Settings imported.");
  }).catch(() => {
    setStatus("Could not import settings file.");
  });

  event.target.value = "";
}

function onKeyDown(event) {
  if (state.shortcutCapture.actionId) {
    handleShortcutCaptureKeydown(event);
    return;
  }

  if (!state.settings.enableShortcuts) {
    return;
  }

  if (el.settingsDialog?.open) {
    return;
  }

  if (isEditableTarget(event.target)) {
    return;
  }

  const combo = getShortcutComboFromEvent(event);
  if (!combo) {
    return;
  }

  const actionId = findShortcutActionByBinding(combo);
  if (!actionId) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (event.repeat && SHORTCUT_NO_REPEAT_ACTIONS.has(actionId)) {
    return;
  }

  runShortcutAction(actionId);
}

function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === "auto") {
    root.removeAttribute("data-theme");
    return;
  }

  root.setAttribute("data-theme", theme);
}

function updateTrackSelectors() {
  updateAudioTrackSelector();
  updateSubtitleTrackSelector();
}

function updateAudioTrackSelector() {
  el.audioTrackSelect.innerHTML = "";
  const audioTracks = el.video.audioTracks;

  if (!audioTracks || audioTracks.length === 0) {
    const option = document.createElement("option");
    option.value = "none";
    option.textContent = "No exposed tracks";
    el.audioTrackSelect.appendChild(option);
    el.audioTrackSelect.disabled = true;
    return;
  }

  let selectedIndex = -1;
  for (let i = 0; i < audioTracks.length; i += 1) {
    const track = audioTracks[i];
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = track.label || track.language || `Track ${i + 1}`;
    if (track.enabled) {
      option.selected = true;
      selectedIndex = i;
    }
    el.audioTrackSelect.appendChild(option);
  }

  if (selectedIndex < 0) {
    selectedIndex = 0;
    if (audioTracks[0]) {
      audioTracks[0].enabled = true;
    }
    el.audioTrackSelect.value = "0";
  }

  el.audioTrackSelect.disabled = false;
}

function onAudioTrackChanged() {
  const audioTracks = el.video.audioTracks;
  if (!audioTracks || audioTracks.length === 0) {
    return;
  }

  const selected = Number(el.audioTrackSelect.value);
  for (let i = 0; i < audioTracks.length; i += 1) {
    audioTracks[i].enabled = i === selected;
  }
}

function updateSubtitleTrackSelector() {
  const previousValue = state.selectedSubtitleTrack || el.subtitleTrackSelect.value;
  el.subtitleTrackSelect.innerHTML = "";

  const offOption = document.createElement("option");
  offOption.value = "off";
  offOption.textContent = "Off";
  el.subtitleTrackSelect.appendChild(offOption);

  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = state.subtitleCues.length ? "External subtitle" : "External subtitle (none loaded)";
  el.subtitleTrackSelect.appendChild(customOption);

  const nativeTracks = el.video.textTracks;
  if (nativeTracks && nativeTracks.length > 0) {
    for (let i = 0; i < nativeTracks.length; i += 1) {
      const track = nativeTracks[i];
      const option = document.createElement("option");
      option.value = `native-${i}`;
      option.textContent = track.label || track.language || `Embedded ${i + 1}`;
      el.subtitleTrackSelect.appendChild(option);
    }
  }

  const values = Array.from(el.subtitleTrackSelect.options).map((option) => option.value);
  if (values.includes(previousValue)) {
    el.subtitleTrackSelect.value = previousValue;
  } else {
    el.subtitleTrackSelect.value = state.settings.showSubtitlesByDefault ? "custom" : "off";
  }

  state.selectedSubtitleTrack = el.subtitleTrackSelect.value;
}

function onSubtitleTrackChanged() {
  const value = el.subtitleTrackSelect.value;
  state.selectedSubtitleTrack = value;
  const nativeTracks = el.video.textTracks;

  if (nativeTracks && nativeTracks.length > 0) {
    for (let i = 0; i < nativeTracks.length; i += 1) {
      nativeTracks[i].mode = "hidden";
    }
  }

  if (value === "off") {
    state.subtitleLoadToken += 1;
    state.settings.showSubtitlesByDefault = false;
    resetExternalSubtitleState();
    updateTrackSelectors();
    saveSettings();
    return;
  }

  if (value === "custom") {
    state.settings.showSubtitlesByDefault = true;
    saveSettings();
    return;
  }

  if (value.startsWith("native-")) {
    state.settings.showSubtitlesByDefault = false;
    const idx = Number(value.split("-")[1]);
    if (nativeTracks && nativeTracks[idx]) {
      nativeTracks[idx].mode = "showing";
    }
    hideSubtitleOverlay();
    saveSettings();
  }
}

function parseSrt(raw) {
  const normalized = raw.replace(/\r/g, "").trim();
  if (!normalized) {
    return [];
  }

  const blocks = normalized.split("\n\n");
  const cues = [];

  blocks.forEach((block) => {
    const lines = block.split("\n");
    const timeLine = lines.find((line) => line.includes("-->"));
    if (!timeLine) {
      return;
    }

    const [start, end] = timeLine.split("-->").map((x) => x.trim());
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);

    cues.push({
      start: parseTimestamp(start.replace(",", ".")),
      end: parseTimestamp(end.replace(",", ".")),
      text: textLines.join("\n")
    });
  });

  return cues
    .filter((cue) => Number.isFinite(cue.start) && Number.isFinite(cue.end))
    .sort((a, b) => a.start - b.start);
}

function parseVtt(raw) {
  const normalized = raw.replace(/\r/g, "").trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const cues = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("WEBVTT") || line.startsWith("NOTE")) {
      continue;
    }

    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((x) => x.trim());
      const textLines = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim()) {
        textLines.push(lines[j]);
        j += 1;
      }

      cues.push({
        start: parseTimestamp(start),
        end: parseTimestamp(end.split(" ")[0]),
        text: textLines.join("\n")
      });

      i = j;
    }
  }

  return cues
    .filter((cue) => Number.isFinite(cue.start) && Number.isFinite(cue.end))
    .sort((a, b) => a.start - b.start);
}

function parseTimestamp(value) {
  const parts = value.split(":").map((x) => x.trim());
  if (parts.length === 2) {
    const [mm, ss] = parts;
    return Number(mm) * 60 + Number(ss);
  }

  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
  }

  return Number.NaN;
}

function getFileFingerprint(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function getCurrentMediaFingerprint() {
  const currentFile = state.playlist[state.currentIndex];
  return currentFile ? getFileFingerprint(currentFile) : "";
}

function isAudioLikeFile(file) {
  if (!file) {
    return false;
  }

  const extension = getFileExtension(file.name);
  if (AUDIO_EXTENSIONS.has(extension)) {
    return true;
  }

  const mimeType = String(file.type || "").toLowerCase();
  return mimeType.startsWith("audio/");
}

async function updateAudioCoverForFile(file) {
  clearAudioCoverThumbnail();
  ensureAudioCoverPlacement();

  if (!file || !isAudioLikeFile(file)) {
    return;
  }

  try {
    const coverBlob = await extractEmbeddedCoverArtBlob(file);
    if (!coverBlob || !el.audioCoverThumb) {
      return;
    }

    state.currentCoverObjectUrl = URL.createObjectURL(coverBlob);
    el.audioCoverThumb.src = state.currentCoverObjectUrl;
    el.audioCoverThumb.classList.remove("hidden");
  } catch {
    clearAudioCoverThumbnail();
  }
}

function clearAudioCoverThumbnail() {
  if (state.currentCoverObjectUrl) {
    URL.revokeObjectURL(state.currentCoverObjectUrl);
    state.currentCoverObjectUrl = null;
  }

  if (el.audioCoverThumb) {
    el.audioCoverThumb.removeAttribute("src");
    el.audioCoverThumb.classList.add("hidden");
  }
}

async function extractEmbeddedCoverArtBlob(file) {
  if (!file) {
    return null;
  }

  const extension = getFileExtension(file.name);
  const mimeType = String(file.type || "").toLowerCase();

  if (extension === "mp3" || mimeType === "audio/mpeg") {
    const fromId3 = await extractId3CoverArtBlob(file);
    if (fromId3) {
      return fromId3;
    }
  }

  if (["m4a", "mp4", "m4b", "aac", "alac"].includes(extension)
    || mimeType.includes("mp4")
    || mimeType.includes("aac")) {
    const fromMp4 = await extractMp4CoverArtBlob(file);
    if (fromMp4) {
      return fromMp4;
    }
  }

  if (extension === "flac" || mimeType.includes("flac")) {
    const fromFlac = await extractFlacCoverArtBlob(file);
    if (fromFlac) {
      return fromFlac;
    }
  }

  return null;
}

async function extractId3CoverArtBlob(file) {
  const readSize = Math.min(Number(file.size || 0), 16 * 1024 * 1024);
  if (!readSize || readSize < 10) {
    return null;
  }

  const bytes = new Uint8Array(await file.slice(0, readSize).arrayBuffer());
  if (decodeAscii(bytes, 0, 3) !== "ID3") {
    return null;
  }

  const versionMajor = bytes[3];
  const tagSize = readSynchsafeInt(bytes, 6);
  const tagEnd = Math.min(bytes.length, 10 + tagSize);
  let cursor = 10;

  while (cursor + 10 <= tagEnd) {
    const frameId = decodeAscii(bytes, cursor, 4);
    if (!frameId.trim()) {
      break;
    }

    const frameSize = versionMajor === 4
      ? readSynchsafeInt(bytes, cursor + 4)
      : readUint32BE(bytes, cursor + 4);

    if (!Number.isFinite(frameSize) || frameSize <= 0) {
      break;
    }

    const dataStart = cursor + 10;
    const dataEnd = Math.min(tagEnd, dataStart + frameSize);
    if (dataEnd <= dataStart) {
      break;
    }

    if (frameId === "APIC") {
      const blob = parseApicFrameToBlob(bytes.slice(dataStart, dataEnd));
      if (blob) {
        return blob;
      }
    }

    cursor = dataEnd;
  }

  return null;
}

function parseApicFrameToBlob(frameBytes) {
  if (!frameBytes || frameBytes.length < 8) {
    return null;
  }

  const encoding = frameBytes[0];
  let cursor = 1;

  let mimeEnd = cursor;
  while (mimeEnd < frameBytes.length && frameBytes[mimeEnd] !== 0) {
    mimeEnd += 1;
  }

  if (mimeEnd >= frameBytes.length) {
    return null;
  }

  const mimeTypeRaw = decodeLatin1(frameBytes.slice(cursor, mimeEnd)).toLowerCase();
  cursor = mimeEnd + 1;

  if (cursor >= frameBytes.length) {
    return null;
  }

  cursor += 1;
  const descriptionEnd = findEncodedStringTerminator(frameBytes, cursor, encoding);
  if (descriptionEnd < cursor || descriptionEnd >= frameBytes.length) {
    return null;
  }

  cursor = descriptionEnd + (encoding === 1 || encoding === 2 ? 2 : 1);
  if (cursor >= frameBytes.length) {
    return null;
  }

  const imageBytes = frameBytes.slice(cursor);
  const mimeType = mimeTypeRaw && mimeTypeRaw !== "-->"
    ? mimeTypeRaw
    : detectImageMime(imageBytes);

  if (!mimeType) {
    return null;
  }

  return new Blob([imageBytes], { type: mimeType });
}

function findEncodedStringTerminator(bytes, start, encoding) {
  if (encoding === 1 || encoding === 2) {
    for (let i = start; i + 1 < bytes.length; i += 2) {
      if (bytes[i] === 0 && bytes[i + 1] === 0) {
        return i;
      }
    }
    return -1;
  }

  for (let i = start; i < bytes.length; i += 1) {
    if (bytes[i] === 0) {
      return i;
    }
  }

  return -1;
}

async function extractMp4CoverArtBlob(file) {
  const fileSize = Number(file.size || 0);
  if (!fileSize || fileSize < 32) {
    return null;
  }

  if (fileSize <= 64 * 1024 * 1024) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return extractMp4CoverArtBlobFromBytes(bytes);
  }

  const scanSize = 32 * 1024 * 1024;
  const headBytes = new Uint8Array(await file.slice(0, scanSize).arrayBuffer());
  const fromHead = extractMp4CoverArtBlobFromBytes(headBytes);
  if (fromHead) {
    return fromHead;
  }

  const tailStart = Math.max(0, fileSize - scanSize);
  if (tailStart <= 0) {
    return null;
  }

  const tailBytes = new Uint8Array(await file.slice(tailStart, fileSize).arrayBuffer());
  return extractMp4CoverArtBlobFromBytes(tailBytes);
}

function extractMp4CoverArtBlobFromBytes(bytes) {
  if (!bytes || bytes.length < 32) {
    return null;
  }

  const signatures = findAsciiSignatureOffsets(bytes, "covr");

  for (let i = 0; i < signatures.length; i += 1) {
    const typeOffset = signatures[i];
    if (typeOffset < 4) {
      continue;
    }

    const atomStart = typeOffset - 4;
    const atomSize = readUint32BE(bytes, atomStart);
    if (!Number.isFinite(atomSize) || atomSize < 16) {
      continue;
    }

    const payloadStart = typeOffset + 4;
    const payloadEnd = Math.min(bytes.length, atomStart + atomSize);
    let cursor = payloadStart;

    while (cursor + 8 <= payloadEnd) {
      const childSize = readUint32BE(bytes, cursor);
      const childType = decodeAscii(bytes, cursor + 4, 4);
      if (!Number.isFinite(childSize) || childSize < 8) {
        break;
      }

      const childEnd = Math.min(payloadEnd, cursor + childSize);
      if (childType === "data" && childEnd - cursor >= 16) {
        const dataInfoOffset = cursor + 8;
        const firstField = readUint32BE(bytes, dataInfoOffset);
        const secondField = readUint32BE(bytes, dataInfoOffset + 4);
        const dataType = (firstField === 0 && (secondField === 13 || secondField === 14))
          ? secondField
          : firstField;
        const imageStart = (firstField === 0 && (secondField === 13 || secondField === 14))
          ? dataInfoOffset + 12
          : dataInfoOffset + 8;
        const imageBytes = bytes.slice(imageStart, childEnd);
        const mimeType = (dataType === 14 ? "image/png" : dataType === 13 ? "image/jpeg" : detectImageMime(imageBytes));
        if (mimeType && imageBytes.length > 8) {
          return new Blob([imageBytes], { type: mimeType });
        }
      }

      if (childEnd <= cursor) {
        break;
      }
      cursor = childEnd;
    }
  }

  return null;
}

async function extractFlacCoverArtBlob(file) {
  const readSize = Math.min(Number(file.size || 0), 8 * 1024 * 1024);
  if (!readSize || readSize < 8) {
    return null;
  }

  const bytes = new Uint8Array(await file.slice(0, readSize).arrayBuffer());
  if (decodeAscii(bytes, 0, 4) !== "fLaC") {
    return null;
  }

  let cursor = 4;
  while (cursor + 4 <= bytes.length) {
    const header = bytes[cursor];
    const isLast = (header & 0x80) !== 0;
    const blockType = header & 0x7f;
    const blockLength = (bytes[cursor + 1] << 16) + (bytes[cursor + 2] << 8) + bytes[cursor + 3];
    cursor += 4;

    if (blockLength < 0 || cursor + blockLength > bytes.length) {
      break;
    }

    if (blockType === 6) {
      const pictureBlock = bytes.slice(cursor, cursor + blockLength);
      const imageBlob = parseFlacPictureBlockToBlob(pictureBlock);
      if (imageBlob) {
        return imageBlob;
      }
    }

    cursor += blockLength;
    if (isLast) {
      break;
    }
  }

  return null;
}

function parseFlacPictureBlockToBlob(blockBytes) {
  if (!blockBytes || blockBytes.length < 36) {
    return null;
  }

  let cursor = 0;

  const pictureType = readUint32BE(blockBytes, cursor);
  if (!Number.isFinite(pictureType)) {
    return null;
  }
  cursor += 4;

  const mimeLength = readUint32BE(blockBytes, cursor);
  cursor += 4;
  if (!Number.isFinite(mimeLength) || mimeLength < 0 || cursor + mimeLength > blockBytes.length) {
    return null;
  }

  const mimeTypeRaw = decodeLatin1(blockBytes.slice(cursor, cursor + mimeLength)).toLowerCase();
  cursor += mimeLength;

  const descriptionLength = readUint32BE(blockBytes, cursor);
  cursor += 4;
  if (!Number.isFinite(descriptionLength) || descriptionLength < 0 || cursor + descriptionLength > blockBytes.length) {
    return null;
  }

  cursor += descriptionLength;

  if (cursor + 16 > blockBytes.length) {
    return null;
  }

  cursor += 16;

  const dataLength = readUint32BE(blockBytes, cursor);
  cursor += 4;
  if (!Number.isFinite(dataLength) || dataLength <= 0 || cursor + dataLength > blockBytes.length) {
    return null;
  }

  const imageBytes = blockBytes.slice(cursor, cursor + dataLength);
  const mimeType = mimeTypeRaw && mimeTypeRaw !== "-->"
    ? mimeTypeRaw
    : detectImageMime(imageBytes);

  if (!mimeType) {
    return null;
  }

  return new Blob([imageBytes], { type: mimeType });
}

function readSynchsafeInt(bytes, offset) {
  if (!bytes || offset < 0 || offset + 4 > bytes.length) {
    return Number.NaN;
  }

  return ((bytes[offset] & 0x7f) << 21)
    | ((bytes[offset + 1] & 0x7f) << 14)
    | ((bytes[offset + 2] & 0x7f) << 7)
    | (bytes[offset + 3] & 0x7f);
}

function decodeAscii(bytes, offset, length) {
  if (!bytes || offset < 0 || length <= 0 || offset + length > bytes.length) {
    return "";
  }

  let value = "";
  for (let i = offset; i < offset + length; i += 1) {
    value += String.fromCharCode(bytes[i]);
  }
  return value;
}

function decodeLatin1(bytes) {
  if (!bytes || !bytes.length) {
    return "";
  }

  let value = "";
  for (let i = 0; i < bytes.length; i += 1) {
    value += String.fromCharCode(bytes[i]);
  }
  return value;
}

function detectImageMime(bytes) {
  if (!bytes || bytes.length < 8) {
    return "";
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp";
  }

  return "";
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);

    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? parsed : fallback;
    }

    if (fallback && typeof fallback === "object") {
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? { ...fallback, ...parsed }
        : fallback;
    }

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function registerServiceWorker() {
  if (IS_FILE_PROTOCOL) {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadedAfterSwUpdate) {
      return;
    }

    reloadedAfterSwUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((registration) => {
      registration.update();
    }).catch(() => {
      setStatus("Service worker registration failed. Offline shell may be unavailable.");
    });
  });
}

function setupFullscreenOrientationHandling() {
  document.addEventListener("fullscreenchange", async () => {
    const isFullscreen = Boolean(document.fullscreenElement);
    applyGpuEnhancementCompatibilityMode();
    if (!isFullscreen) {
      try {
        if (screen.orientation?.unlock) {
          screen.orientation.unlock();
        }
      } catch {
        // Orientation unlock is not supported in all browsers.
      }
      return;
    }

    if (!isLikelyMobile()) {
      return;
    }

    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch {
      // Ignore lock failures on restricted platforms such as iOS Safari.
    }
  });
}

function isLikelyMobile() {
  return window.matchMedia("(max-width: 980px)").matches;
}

function setupTouchGestures() {
  const shell = el.videoShell;
  if (!shell) {
    return;
  }

  shell.addEventListener("pointerdown", onGestureStart, { passive: true });
  shell.addEventListener("pointermove", onGestureMove, { passive: true });
  shell.addEventListener("pointerup", onGestureEnd, { passive: true });
  shell.addEventListener("pointercancel", onGestureEnd, { passive: true });
  shell.addEventListener("dblclick", (event) => {
    const target = event.target;
    if (target instanceof Element) {
      const isControlInteraction = Boolean(target.closest(".plyr__controls, .plyr__menu, button, select, input, label, .dock-btn"));
      if (isControlInteraction) {
        return;
      }
    }

    toggleFullscreen();
  });
}

function onGestureStart(event) {
  if (event.pointerType === "mouse") {
    return;
  }

  state.touch.active = true;
  state.touch.pointerId = event.pointerId;
  state.touch.startX = event.clientX;
  state.touch.startY = event.clientY;
  state.touch.baseTime = el.video.currentTime || 0;
  state.touch.baseVolume = el.video.volume;
  state.touch.mode = null;
}

function onGestureMove(event) {
  if (!state.touch.active || state.touch.pointerId !== event.pointerId) {
    return;
  }

  const dx = event.clientX - state.touch.startX;
  const dy = event.clientY - state.touch.startY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (!state.touch.mode) {
    state.touch.mode = absDx >= absDy ? "seek" : "volume";
  }

  if (state.touch.mode === "seek") {
    const seekSeconds = dx / 16;
    el.video.currentTime = Math.max(0, state.touch.baseTime + seekSeconds);
  } else if (state.touch.mode === "volume") {
    const volumeDelta = -dy / 260;
    el.video.volume = clamp(state.touch.baseVolume + volumeDelta, 0, 1);
    el.volumeInput.value = String(el.video.volume);
  }
}

function onGestureEnd(event) {
  if (!state.touch.active || state.touch.pointerId !== event.pointerId) {
    return;
  }

  state.touch.active = false;
  state.touch.pointerId = null;
  state.touch.mode = null;
}
