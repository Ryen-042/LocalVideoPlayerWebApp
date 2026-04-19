(function () {
  const isFileProtocol = window.location.protocol === "file:";

  function loadScript(src, isModule) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      if (isModule) {
        script.type = "module";
      }
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  if (!isFileProtocol) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "./manifest.webmanifest";
    document.head.appendChild(manifest);

    loadScript("./vendor/plyr/plyr.min.js?v=1", false)
      .catch(() => {
        // App will still run without Plyr; custom controls remain available.
      })
      .finally(() => loadScript("./app.js?v=20260419h", true));
    return;
  }

  const banner = document.getElementById("modeBanner");
  if (banner) {
    banner.classList.remove("hidden");
    banner.textContent = "File mode detected: PWA features are reduced. Core playback, playlist, and settings remain available.";
  }

  loadScript("./vendor/plyr/plyr.min.js?v=1", false)
    .catch(() => {
      // App will still run without Plyr in file mode fallback.
    })
    .finally(() => loadScript("./app.js?v=20260419h", false));
})();
